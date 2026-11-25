from __future__ import annotations

from typing import Any


def obter_serie_mensal(conexao: Any) -> list[dict[str, int]]:
    """Extrai a série mensal de admissões a partir de empregos_turismo."""
    anos_rows = conexao.exec_driver_sql(
        """
        SELECT DISTINCT ano_referencia AS ano
        FROM empregos_turismo
        WHERE ano_referencia IS NOT NULL
        ORDER BY ano_referencia ASC
        """
    ).fetchall()

    if not anos_rows:
        return []

    anos = [int(row[0]) for row in anos_rows]

    contagens_rows = conexao.exec_driver_sql(
        """
        SELECT
            ano_referencia AS ano,
            mes_admissao AS mes,
            COUNT(*) AS total_admissoes
        FROM empregos_turismo
        WHERE mes_admissao BETWEEN 1 AND 12
        GROUP BY ano_referencia, mes_admissao
        ORDER BY ano_referencia ASC, mes_admissao ASC
        """
    ).fetchall()

    mapa_contagens: dict[tuple[int, int], int] = {
        (int(row[0]), int(row[1])): int(row[2])
        for row in contagens_rows
    }

    serie: list[dict[str, int]] = []
    for ano in anos:
        for mes in range(1, 13):
            serie.append(
                {
                    "ano": ano,
                    "mes": mes,
                    "total_admissoes": mapa_contagens.get((ano, mes), 0),
                }
            )

    return serie


def gerar_serie_mock_fallback() -> list[dict[str, int]]:
    """
    Gera série mensal de fallback baseada nos registros mockados
    distribuídos ao longo de 2024 e 2025 para ilustrar a previsão sazonal
    enquanto o banco real não está disponível.
    """
    padrao_2024 = [5, 4, 3, 2, 2, 3, 4, 2, 2, 3, 4, 6]
    padrao_2025 = [6, 5, 3, 2, 3, 3, 5, 2, 3, 3, 4, 7]

    serie: list[dict[str, int]] = []
    for mes, total in enumerate(padrao_2024, start=1):
        serie.append({"ano": 2024, "mes": mes, "total_admissoes": total})
    for mes, total in enumerate(padrao_2025, start=1):
        serie.append({"ano": 2025, "mes": mes, "total_admissoes": total})

    return serie


def gerar_previsao_naive_sazonal(
    serie: list[dict[str, int]],
    horizonte: int = 3,
) -> list[dict[str, Any]]:
    """Projeta os próximos meses repetindo o mesmo mês do ano anterior."""
    if not serie:
        return []

    mapa_valores = {(item["ano"], item["mes"]): item["total_admissoes"] for item in serie}
    ultimo = serie[-1]
    ano_atual = ultimo["ano"]
    mes_atual = ultimo["mes"]

    previsoes: list[dict[str, Any]] = []
    for _ in range(horizonte):
        mes_atual += 1
        if mes_atual > 12:
            mes_atual = 1
            ano_atual += 1

        ano_ref = ano_atual - 1
        previsto = mapa_valores.get((ano_ref, mes_atual), 0)
        previsoes.append(
            {
                "ano": ano_atual,
                "mes": mes_atual,
                "previsto": previsto,
                "referencia": f"{mes_atual:02d}/{ano_ref}",
            }
        )

    return previsoes


def executar_backtesting(serie: list[dict[str, int]]) -> list[dict[str, Any]]:
    """
    Avalia o modelo naive sazonal em ordem estritamente temporal:
    para cada mês a partir do 13º, usa apenas a observação de 12 meses antes.
    """
    if len(serie) < 24:
        return []

    comparacoes: list[dict[str, Any]] = []
    for indice in range(12, len(serie)):
        atual = serie[indice]
        anterior = serie[indice - 12]
        real = int(atual["total_admissoes"])
        previsto = int(anterior["total_admissoes"])
        comparacoes.append(
            {
                "ano": atual["ano"],
                "mes": atual["mes"],
                "real": real,
                "previsto": previsto,
                "erro_absoluto": abs(real - previsto),
            }
        )

    return comparacoes


def calcular_mae(comparacoes: list[dict[str, Any]]) -> float:
    """Calcula o Erro Absoluto Médio (MAE) em número de admissões."""
    if not comparacoes:
        return 0.0
    total_erro = sum(int(item["erro_absoluto"]) for item in comparacoes)
    return round(total_erro / len(comparacoes), 2)


def montar_resultado_previsao(
    serie: list[dict[str, int]],
    origem_dados: str,
    horizonte: int = 3,
) -> dict[str, Any]:
    """Monta a estrutura completa de saída da previsão sazonal."""
    if not serie:
        return {
            "disponivel": False,
            "origem_dados": origem_dados,
            "mensagem": "Nenhum registro mensal de admissão encontrado na base.",
            "anos_disponiveis": [],
        }

    anos = sorted({int(item["ano"]) for item in serie})
    anos_esperados = list(range(anos[0], anos[-1] + 1))

    if anos != anos_esperados:
        return {
            "disponivel": False,
            "origem_dados": origem_dados,
            "mensagem": "Há lacunas entre os anos disponíveis na série histórica, impedindo a comparação sazonal contínua.",
            "anos_disponiveis": anos,
        }

    if len(serie) < 12:
        return {
            "disponivel": False,
            "origem_dados": origem_dados,
            "mensagem": "Histórico insuficiente. É necessário pelo menos um ciclo anual completo (12 meses) de dados mensais.",
            "anos_disponiveis": anos,
        }

    previsoes = gerar_previsao_naive_sazonal(serie, horizonte=horizonte)
    comparacoes = executar_backtesting(serie)
    mae = calcular_mae(comparacoes)

    observacao_backtesting = (
        None
        if comparacoes
        else (
            f"A base contém apenas o ano de {anos[0]} ({len(serie)} meses). "
            "A projeção sazonal é calculada normalmente, mas o backtesting exige um ano anterior para comparação."
        )
    )

    return {
        "disponivel": True,
        "origem_dados": origem_dados,
        "metodo": "Naive sazonal (mesmo mês do ano anterior)",
        "horizonte_meses": horizonte,
        "anos_disponiveis": anos,
        "serie_observada": serie,
        "previsoes": previsoes,
        "backtesting": {
            "disponivel": len(comparacoes) > 0,
            "mae": mae,
            "total_meses_avaliados": len(comparacoes),
            "comparacoes": comparacoes,
            "observacao": observacao_backtesting,
        },
    }


def analisar_previsao_sazonal(
    conexao: Any | None,
    horizonte: int = 3,
) -> dict[str, Any]:
    """
    Executa a análise preditiva sazonal usando o banco SQLite como fonte
    primária e recorrendo ao fallback quando a conexão não existir ou estiver vazia.
    """
    if conexao is not None:
        serie_real = obter_serie_mensal(conexao)
        if serie_real:
            return montar_resultado_previsao(
                serie=serie_real,
                origem_dados="csv_real",
                horizonte=horizonte,
            )

    serie_mock = gerar_serie_mock_fallback()
    return montar_resultado_previsao(
        serie=serie_mock,
        origem_dados="mock_fallback",
        horizonte=horizonte,
    )