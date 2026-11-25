import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any
from previsao import analisar_previsao_sazonal
import polars as pl
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Connection

MESES_NOMES = {
    1: "Janeiro",
    2: "Fevereiro",
    3: "Março",
    4: "Abril",
    5: "Maio",
    6: "Junho",
    7: "Julho",
    8: "Agosto",
    9: "Setembro",
    10: "Outubro",
    11: "Novembro",
    12: "Dezembro",
}


def conectar(caminho_db: Path) -> Connection:
    """Abre uma conexão SQLAlchemy para leitura do banco analítico."""
    if not caminho_db.exists():
        raise FileNotFoundError(f"Banco SQLite não encontrado: {caminho_db}")

    engine = create_engine(f"sqlite:///{caminho_db.resolve().as_posix()}")

    @event.listens_for(engine, "connect")
    def _configurar_sqlite(dbapi_conexao, _registro) -> None:
        cursor = dbapi_conexao.cursor()
        try:
            cursor.execute("PRAGMA query_only = ON;")
            cursor.execute("PRAGMA cache_size = -65536;")  # 64 MiB
            cursor.execute("PRAGMA temp_store = FILE;")
            cursor.execute("PRAGMA mmap_size = 268435456;")  # até 256 MiB
        finally:
            cursor.close()

    return engine.connect()


def _consultar(
    conexao: Connection,
    consulta: str,
    parametros: Sequence[Any] = (),
) -> list[dict[str, Any]]:
    """Executa SQL no SQLite e materializa apenas o resultado agregado em Polars."""
    resultado = conexao.exec_driver_sql(consulta, tuple(parametros))
    colunas = list(resultado.keys())
    linhas = resultado.fetchall()
    if not linhas:
        return []
    return pl.DataFrame(linhas, schema=colunas, orient="row").to_dicts()


def _escalar(conexao: Connection, consulta: str) -> Any:
    """Retorna o primeiro valor de uma consulta escalar."""
    return conexao.exec_driver_sql(consulta).scalar_one()


def p1_cidades_mais_empregos(conexao: Connection, limite: int = 15) -> list[dict]:
    consulta = """
        SELECT
            m.municipio_codigo,
            m.municipio_nome,
            m.uf_nome,
            COUNT(*) AS total_empregos,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM empregos_turismo), 2) AS percentual_nacional
        FROM empregos_turismo e
        JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
        GROUP BY m.municipio_codigo, m.municipio_nome, m.uf_nome
        ORDER BY total_empregos DESC
        LIMIT ?;
    """
    return _consultar(conexao, consulta, (limite,))


def p2_meses_mais_admissoes_por_cidade(
    conexao: Connection, top_cidades: int = 10
) -> list[dict]:
    consulta = """
        WITH top_municipios AS (
            SELECT municipio_codigo
            FROM empregos_turismo
            GROUP BY municipio_codigo
            ORDER BY COUNT(*) DESC
            LIMIT ?
        ),
        admissoes_mes AS (
            SELECT
                e.municipio_codigo,
                m.municipio_nome,
                m.uf_nome,
                e.mes_admissao,
                COUNT(*) AS total_admissoes,
                RANK() OVER (
                    PARTITION BY e.municipio_codigo
                    ORDER BY COUNT(*) DESC
                ) AS posicao
            FROM empregos_turismo e
            JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
            WHERE e.municipio_codigo IN (SELECT municipio_codigo FROM top_municipios)
              AND e.mes_admissao IS NOT NULL
            GROUP BY e.municipio_codigo, m.municipio_nome, m.uf_nome, e.mes_admissao
        )
        SELECT
            municipio_codigo,
            municipio_nome,
            uf_nome,
            mes_admissao,
            total_admissoes,
            posicao
        FROM admissoes_mes
        WHERE posicao <= 3
        ORDER BY municipio_nome ASC, posicao ASC;
    """
    resultados = []
    for linha in _consultar(conexao, consulta, (top_cidades,)):
        item = dict(linha)
        item["mes_nome"] = MESES_NOMES.get(
            item["mes_admissao"], str(item["mes_admissao"])
        )
        resultados.append(item)
    return resultados


def p3_cidades_maior_remuneracao(
    conexao: Connection, minimo_vinculos: int = 500, limite: int = 15
) -> list[dict]:
    consulta = """
        WITH remuneracoes_validas AS (
            SELECT
                e.municipio_codigo,
                m.municipio_nome,
                m.uf_nome,
                e.remuneracao_dezembro_centavos / 100.0 AS remuneracao_reais,
                ROW_NUMBER() OVER (
                    PARTITION BY e.municipio_codigo
                    ORDER BY e.remuneracao_dezembro_centavos
                ) AS rn,
                COUNT(*) OVER (PARTITION BY e.municipio_codigo) AS qtd_validos
            FROM empregos_turismo e
            JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
            WHERE e.remuneracao_dezembro_centavos IS NOT NULL
              AND e.remuneracao_dezembro_centavos > 0
        )
        SELECT
            municipio_codigo,
            municipio_nome,
            uf_nome,
            qtd_validos AS vinculos_remunerados_dezembro,
            ROUND(AVG(remuneracao_reais), 2) AS remuneracao_media_reais,
            ROUND(
                AVG(
                    CASE
                        WHEN rn IN ((qtd_validos + 1) / 2, (qtd_validos + 2) / 2)
                        THEN remuneracao_reais
                    END
                ),
                2
            ) AS remuneracao_mediana_reais,
            ROUND(SUM(remuneracao_reais), 2) AS massa_salarial_dezembro_reais
        FROM remuneracoes_validas
        GROUP BY municipio_codigo, municipio_nome, uf_nome, qtd_validos
        HAVING qtd_validos >= ?
        ORDER BY remuneracao_mediana_reais DESC, remuneracao_media_reais DESC
        LIMIT ?;
    """
    return _consultar(
        conexao,
        consulta,
        (
            minimo_vinculos,
            limite,
        ),
    )


def p4_cnaes_maior_remuneracao_mediana_dezembro(
    conexao: Connection, minimo_vinculos: int = 100, limite: int = 15
) -> list[dict]:
    consulta = """
        WITH remuneracoes_cnae AS (
            SELECT
                e.cnae_subclasse,
                e.act_codigo,
                COALESCE(a.cnae_subclasse_nome, a.act_nome) AS atividade_nome,
                a.act_nome,
                e.remuneracao_dezembro_centavos / 100.0 AS remuneracao_reais,
                ROW_NUMBER() OVER (
                    PARTITION BY e.cnae_subclasse, e.act_codigo
                    ORDER BY e.remuneracao_dezembro_centavos
                ) AS rn,
                COUNT(*) OVER (PARTITION BY e.cnae_subclasse, e.act_codigo) AS qtd_validos
            FROM empregos_turismo e
            JOIN atividades a
              ON a.cnae_subclasse = e.cnae_subclasse
             AND a.act_codigo = e.act_codigo
            WHERE e.remuneracao_dezembro_centavos IS NOT NULL
              AND e.remuneracao_dezembro_centavos > 0
        )
        SELECT
            cnae_subclasse,
            act_codigo,
            atividade_nome,
            act_nome,
            qtd_validos AS vinculos_remunerados_dezembro,
            ROUND(
                AVG(
                    CASE
                        WHEN rn IN ((qtd_validos + 1) / 2, (qtd_validos + 2) / 2)
                        THEN remuneracao_reais
                    END
                ),
                2
            ) AS remuneracao_mediana_reais,
            ROUND(AVG(remuneracao_reais), 2) AS remuneracao_media_reais
        FROM remuneracoes_cnae
        GROUP BY cnae_subclasse, act_codigo, atividade_nome, act_nome, qtd_validos
        HAVING qtd_validos >= ?
        ORDER BY remuneracao_mediana_reais DESC
        LIMIT ?;
    """
    return _consultar(
        conexao,
        consulta,
        (
            minimo_vinculos,
            limite,
        ),
    )


def p5_priorizar_busca_trabalho(
    conexao: Connection, minimo_admissoes_mes: int = 100, limite: int = 15
) -> list[dict]:
    consulta = """
        WITH base_cidade_mes AS (
            SELECT
                e.municipio_codigo,
                m.municipio_nome,
                m.uf_nome,
                e.mes_admissao,
                COUNT(*) AS total_admissoes,
                ROUND(
                    AVG(
                        CASE
                            WHEN e.remuneracao_dezembro_centavos > 0
                            THEN e.remuneracao_dezembro_centavos / 100.0
                        END
                    ),
                    2
                ) AS remuneracao_media_reais
            FROM empregos_turismo e
            JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
            WHERE e.mes_admissao IS NOT NULL
            GROUP BY e.municipio_codigo, m.municipio_nome, m.uf_nome, e.mes_admissao
            HAVING COUNT(*) >= ?
        ),
        limites AS (
            SELECT
                MAX(total_admissoes) AS max_adm,
                MAX(remuneracao_media_reais) AS max_rem
            FROM base_cidade_mes
        )
        SELECT
            b.municipio_codigo,
            b.municipio_nome,
            b.uf_nome,
            b.mes_admissao,
            b.total_admissoes,
            b.remuneracao_media_reais,
            ROUND(
                (
                    (b.total_admissoes * 1.0 / NULLIF(l.max_adm, 0)) * 0.5 +
                    (COALESCE(b.remuneracao_media_reais, 0) * 1.0 / NULLIF(l.max_rem, 0)) * 0.5
                ) * 100,
                2
            ) AS indice_oportunidade
        FROM base_cidade_mes b
        CROSS JOIN limites l
        ORDER BY indice_oportunidade DESC
        LIMIT ?;
    """
    resultados = []
    for linha in _consultar(conexao, consulta, (minimo_admissoes_mes, limite)):
        item = dict(linha)
        item["mes_nome"] = MESES_NOMES.get(
            item["mes_admissao"], str(item["mes_admissao"])
        )
        resultados.append(item)
    return resultados


def p6_cidades_por_cnae(conexao: Connection, top_cnaes: int = 10) -> list[dict]:
    consulta = """
        WITH top_atividades AS (
            SELECT cnae_subclasse, act_codigo
            FROM empregos_turismo
            GROUP BY cnae_subclasse, act_codigo
            ORDER BY COUNT(*) DESC
            LIMIT ?
        ),
        contagem AS (
            SELECT
                e.cnae_subclasse,
                e.act_codigo,
                COALESCE(a.cnae_subclasse_nome, a.act_nome) AS atividade_nome,
                m.municipio_nome,
                m.uf_nome,
                COUNT(*) AS total_empregos,
                RANK() OVER (
                    PARTITION BY e.cnae_subclasse, e.act_codigo
                    ORDER BY COUNT(*) DESC
                ) AS posicao
            FROM empregos_turismo e
            JOIN atividades a
              ON a.cnae_subclasse = e.cnae_subclasse
             AND a.act_codigo = e.act_codigo
            JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
            WHERE (e.cnae_subclasse, e.act_codigo) IN (
                SELECT cnae_subclasse, act_codigo FROM top_atividades
            )
            GROUP BY e.cnae_subclasse, e.act_codigo, atividade_nome, m.municipio_nome, m.uf_nome
        )
        SELECT
            cnae_subclasse,
            act_codigo,
            atividade_nome,
            municipio_nome,
            uf_nome,
            total_empregos,
            posicao
        FROM contagem
        WHERE posicao <= 3
        ORDER BY cnae_subclasse ASC, posicao ASC;
    """
    return _consultar(conexao, consulta, (top_cnaes,))


def p7_participacao_mulheres(
    conexao: Connection, minimo_vinculos: int = 200, limite: int = 15
) -> dict[str, list[dict]]:
    por_cidade = """
        SELECT
            m.municipio_codigo,
            m.municipio_nome,
            m.uf_nome,
            COUNT(*) AS total_empregos,
            SUM(CASE WHEN LOWER(e.sexo) = 'feminino' THEN 1 ELSE 0 END) AS total_mulheres,
            ROUND(
                SUM(CASE WHEN LOWER(e.sexo) = 'feminino' THEN 1 ELSE 0 END) * 100.0
                / NULLIF(COUNT(*), 0),
                2
            ) AS percentual_mulheres
        FROM empregos_turismo e
        JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
        WHERE e.sexo IS NOT NULL
        GROUP BY m.municipio_codigo, m.municipio_nome, m.uf_nome
        HAVING COUNT(*) >= ?
        ORDER BY total_empregos DESC
        LIMIT ?;
    """
    por_cnae = """
        SELECT
            e.cnae_subclasse,
            e.act_codigo,
            COALESCE(a.cnae_subclasse_nome, a.act_nome) AS atividade_nome,
            COUNT(*) AS total_empregos,
            SUM(CASE WHEN LOWER(e.sexo) = 'feminino' THEN 1 ELSE 0 END) AS total_mulheres,
            ROUND(
                SUM(CASE WHEN LOWER(e.sexo) = 'feminino' THEN 1 ELSE 0 END) * 100.0
                / NULLIF(COUNT(*), 0),
                2
            ) AS percentual_mulheres
        FROM empregos_turismo e
        JOIN atividades a
          ON a.cnae_subclasse = e.cnae_subclasse
         AND a.act_codigo = e.act_codigo
        WHERE e.sexo IS NOT NULL
        GROUP BY e.cnae_subclasse, e.act_codigo, atividade_nome
        HAVING COUNT(*) >= ?
        ORDER BY total_empregos DESC
        LIMIT ?;
    """
    return {
        "por_cidade": _consultar(conexao, por_cidade, (minimo_vinculos, limite)),
        "por_atividade": _consultar(conexao, por_cnae, (minimo_vinculos, limite)),
    }


def p8_escolaridade_mais_comum(
    conexao: Connection, limite: int = 15
) -> dict[str, list[dict]]:
    por_cidade = """
        WITH contagem AS (
            SELECT
                m.municipio_codigo,
                m.municipio_nome,
                m.uf_nome,
                e.escolaridade,
                COUNT(*) AS total_trabalhadores,
                SUM(COUNT(*)) OVER (PARTITION BY m.municipio_codigo) AS total_cidade,
                ROW_NUMBER() OVER (
                    PARTITION BY m.municipio_codigo
                    ORDER BY COUNT(*) DESC
                ) AS rn
            FROM empregos_turismo e
            JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
            WHERE e.escolaridade IS NOT NULL
            GROUP BY m.municipio_codigo, m.municipio_nome, m.uf_nome, e.escolaridade
        )
        SELECT
            municipio_codigo,
            municipio_nome,
            uf_nome,
            escolaridade AS escolaridade_mais_comum,
            total_trabalhadores,
            total_cidade,
            ROUND(total_trabalhadores * 100.0 / NULLIF(total_cidade, 0), 2) AS percentual_na_cidade
        FROM contagem
        WHERE rn = 1
        ORDER BY total_cidade DESC
        LIMIT ?;
    """
    por_cnae = """
        WITH contagem AS (
            SELECT
                e.cnae_subclasse,
                e.act_codigo,
                COALESCE(a.cnae_subclasse_nome, a.act_nome) AS atividade_nome,
                e.escolaridade,
                COUNT(*) AS total_trabalhadores,
                SUM(COUNT(*)) OVER (PARTITION BY e.cnae_subclasse, e.act_codigo) AS total_atividade,
                ROW_NUMBER() OVER (
                    PARTITION BY e.cnae_subclasse, e.act_codigo
                    ORDER BY COUNT(*) DESC
                ) AS rn
            FROM empregos_turismo e
            JOIN atividades a
              ON a.cnae_subclasse = e.cnae_subclasse
             AND a.act_codigo = e.act_codigo
            WHERE e.escolaridade IS NOT NULL
            GROUP BY e.cnae_subclasse, e.act_codigo, atividade_nome, e.escolaridade
        )
        SELECT
            cnae_subclasse,
            act_codigo,
            atividade_nome,
            escolaridade AS escolaridade_mais_comum,
            total_trabalhadores,
            total_atividade,
            ROUND(total_trabalhadores * 100.0 / NULLIF(total_atividade, 0), 2) AS percentual_na_atividade
        FROM contagem
        WHERE rn = 1
        ORDER BY total_atividade DESC
        LIMIT ?;
    """
    return {
        "por_cidade": _consultar(conexao, por_cidade, (limite,)),
        "por_atividade": _consultar(conexao, por_cnae, (limite,)),
    }


def validar_consistencia_totais(conexao: Connection) -> dict:
    total_geral = _escalar(conexao, "SELECT COUNT(*) FROM empregos_turismo;")
    soma_por_uf = _escalar(
        conexao,
        """
        SELECT COALESCE(SUM(qtd), 0)
        FROM (
            SELECT COUNT(*) AS qtd
            FROM empregos_turismo e
            JOIN municipios m ON m.municipio_codigo = e.municipio_codigo
            GROUP BY m.uf_codigo
        );
        """,
    )
    soma_por_act = _escalar(
        conexao,
        """
        SELECT COALESCE(SUM(qtd), 0)
        FROM (
            SELECT COUNT(*) AS qtd
            FROM empregos_turismo
            GROUP BY act_codigo
        );
        """,
    )
    return {
        "total_geral_registros": total_geral,
        "soma_recorte_uf": soma_por_uf,
        "soma_recorte_act": soma_por_act,
        "consistente": total_geral == soma_por_uf == soma_por_act,
    }


def gerar_relatorio_completo(caminho_db: Path) -> dict:
    conexao = conectar(caminho_db)
    try:
        return {
            "validacao_integridade": validar_consistencia_totais(conexao),
            "p1_cidades_mais_empregos": p1_cidades_mais_empregos(conexao),
            "p2_meses_mais_admissoes_por_cidade": p2_meses_mais_admissoes_por_cidade(
                conexao
            ),
            "p3_cidades_maior_remuneracao": p3_cidades_maior_remuneracao(conexao),
            "p4_cnaes_maior_remuneracao_mediana_dezembro": p4_cnaes_maior_remuneracao_mediana_dezembro(
                conexao
            ),
            "p5_priorizar_busca_trabalho": p5_priorizar_busca_trabalho(conexao),
            "p6_cidades_por_cnae": p6_cidades_por_cnae(conexao),
            "p7_participacao_mulheres": p7_participacao_mulheres(conexao),
            "p8_escolaridade_mais_comum": p8_escolaridade_mais_comum(conexao),
            "p9_previsao_sazonal": analisar_previsao_sazonal(conexao),
        }
    finally:
        engine = conexao.engine
        conexao.close()
        engine.dispose()


if __name__ == "__main__":
    raiz_projeto = Path(__file__).resolve().parent.parent
    caminho_db_padrao = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else raiz_projeto / "dados" / "turismo.db"
    )
    caminho_saida_json = raiz_projeto / "docs" / "indicadores_turismo_2025_v2.json"
    caminho_frontend = raiz_projeto / "frontend" / "public" / "previsao_sazonal.json"
    caminho_frontend.parent.mkdir(parents=True, exist_ok=True)

    if not caminho_db_padrao.exists():
        caminho_frontend.write_text(
            json.dumps(analisar_previsao_sazonal(None), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"Banco não encontrado; fallback mock salvo em: {caminho_frontend}")
        sys.exit(0)

    relatorio = gerar_relatorio_completo(caminho_db_padrao)
    caminho_saida_json.parent.mkdir(parents=True, exist_ok=True)
    caminho_saida_json.write_text(
        json.dumps(relatorio, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    caminho_frontend.write_text(
        json.dumps(relatorio["p9_previsao_sazonal"], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("=== VALIDAÇÃO DE TOTAIS ===")
    print(json.dumps(relatorio["validacao_integridade"], ensure_ascii=False, indent=2))
    print(f"\nRelatório completo salvo em: {caminho_saida_json}")