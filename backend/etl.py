import csv
import hashlib
import json
import sqlite3
import sys
import urllib.request
from pathlib import Path


def calcular_sha256(caminho_arquivo: Path) -> str:
    hasher = hashlib.sha256()
    with caminho_arquivo.open("rb") as arquivo:
        for bloco in iter(lambda: arquivo.read(1024 * 1024), b""):
            hasher.update(bloco)
    return hasher.hexdigest()


def limpar_texto(valor: str | None) -> str | None:
    if valor is None:
        return None
    texto = " ".join(valor.strip().split())
    return texto if texto else None


def converter_mes(valor: str | None) -> int | None:
    texto = limpar_texto(valor)
    if not texto:
        return None
    try:
        mes = int(float(texto.replace(",", ".")))
        return mes if 1 <= mes <= 12 else None
    except ValueError:
        return None


def converter_centavos(valor: str | None) -> int | None:
    texto = limpar_texto(valor)
    if not texto:
        return None
    try:
        reais = float(texto.replace(",", "."))
        if reais < 0:
            return None
        return int(round(reais * 100))
    except ValueError:
        return None


def consultar_catalogo_ibge(endpoint: str, codigo: str, cache: dict[str, str | None]) -> str | None:
    if codigo in cache:
        return cache[codigo]
    url = f"https://servicodados.ibge.gov.br/api/v2/cnae/{endpoint}/{codigo}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))
            if isinstance(dados, list) and dados:
                descricao = dados[0].get("descricao")
            elif isinstance(dados, dict):
                descricao = dados.get("descricao")
            else:
                descricao = None
            cache[codigo] = limpar_texto(descricao)
    except Exception:
        cache[codigo] = None
    return cache[codigo]


def inicializar_banco(conexao: sqlite3.Connection, caminho_schema: Path) -> None:
    conexao.execute("PRAGMA foreign_keys = ON;")
    tabela_existe = conexao.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'empregos_turismo';"
    ).fetchone()
    if not tabela_existe:
        script_sql = caminho_schema.read_text(encoding="utf-8")
        conexao.executescript(script_sql)
        conexao.execute("PRAGMA foreign_keys = ON;")


def detectar_delimitador(caminho_csv: Path, encoding: str) -> str:
    with caminho_csv.open("r", encoding=encoding, errors="replace") as arquivo:
        amostra = arquivo.readline()
    return ";" if amostra.count(";") > amostra.count(",") else ","


def executar_etl(caminho_csv: Path, caminho_db: Path, caminho_schema: Path) -> None:
    if not caminho_csv.exists():
        raise FileNotFoundError(f"Arquivo CSV não encontrado: {caminho_csv}")
    if not caminho_schema.exists():
        raise FileNotFoundError(f"Schema SQL não encontrado: {caminho_schema}")

    caminho_db.parent.mkdir(parents=True, exist_ok=True)
    sha256_arquivo = calcular_sha256(caminho_csv)

    conexao = sqlite3.connect(caminho_db)
    try:
        inicializar_banco(conexao, caminho_schema)

        ja_importado = conexao.execute(
            "SELECT arquivo_id, nome_arquivo FROM arquivos_importados WHERE sha256 = ?;",
            (sha256_arquivo,),
        ).fetchone()
        if ja_importado:
            print(
                f"Arquivo já importado anteriormente (arquivo_id={ja_importado[0]}, "
                f"nome={ja_importado[1]}). Nenhuma alteração realizada."
            )
            return

        encoding = "utf-8-sig"
        try:
            with caminho_csv.open("r", encoding=encoding) as teste:
                teste.read(4096)
        except UnicodeDecodeError:
            encoding = "latin-1"

        delimitador = detectar_delimitador(caminho_csv, encoding)

        lidos = 0
        aceitos = 0
        descartados: dict[str, int] = {
            "campos_obrigatorios_ausentes": 0,
            "ano_referencia_invalido": 0,
            "duplicata_no_arquivo": 0,
        }

        municipios_vistos: set[str] = set()
        atividades_vistas: set[tuple[str, str]] = set()
        registros_vistos: set[tuple] = set()
        cache_classes: dict[str, str | None] = {}
        cache_subclasses: dict[str, str | None] = {}

        lote_municipios: list[tuple] = []
        lote_atividades: list[tuple] = []
        lote_empregos: list[tuple] = []

        with conexao:
            cursor = conexao.execute(
                "INSERT INTO arquivos_importados (nome_arquivo, sha256) VALUES (?, ?);",
                (caminho_csv.name, sha256_arquivo),
            )
            arquivo_id = cursor.lastrowid

            with caminho_csv.open("r", encoding=encoding, newline="") as arquivo:
                leitor = csv.DictReader(arquivo, delimiter=delimitador)
                for linha_origem, linha in enumerate(leitor, start=1):
                    lidos += 1

                    ano_raw = limpar_texto(linha.get("Ano"))
                    municipio_codigo = limpar_texto(linha.get("Municipio_Codigo"))
                    municipio_nome = limpar_texto(linha.get("Municipio"))
                    uf_codigo = limpar_texto(linha.get("UF_Codigo"))
                    uf_nome = limpar_texto(linha.get("UF"))
                    regiao_codigo = limpar_texto(linha.get("Regiao_Codigo"))
                    regiao_nome = limpar_texto(linha.get("Regiao_UF"))
                    cnae_classe = limpar_texto(linha.get("CNAE_2.0_Classe"))
                    cnae_subclasse = limpar_texto(linha.get("CNAE_2.0_Subclasse"))
                    act_codigo = limpar_texto(linha.get("ACT_Codigo"))
                    act_nome = limpar_texto(linha.get("ACT"))

                    if not all(
                        [
                            ano_raw,
                            municipio_codigo,
                            municipio_nome,
                            uf_codigo,
                            uf_nome,
                            regiao_codigo,
                            regiao_nome,
                            cnae_classe,
                            cnae_subclasse,
                            act_codigo,
                            act_nome,
                        ]
                    ):
                        descartados["campos_obrigatorios_ausentes"] += 1
                        continue

                    try:
                        ano_referencia = int(float(ano_raw))
                    except ValueError:
                        descartados["ano_referencia_invalido"] += 1
                        continue

                    regiao_turistica = limpar_texto(linha.get("Regiao_Turistica"))
                    mes_admissao = converter_mes(linha.get("Mes_Admissao"))
                    remuneracao_centavos = converter_centavos(linha.get("Remuneracao_Dezembro"))
                    sexo = limpar_texto(linha.get("Sexo"))
                    escolaridade = limpar_texto(linha.get("Escolaridade_Rotulo"))

                    chave_dedup = (
                        limpar_texto(linha.get("Id")),
                        ano_referencia,
                        municipio_codigo,
                        cnae_subclasse,
                        act_codigo,
                        mes_admissao,
                        remuneracao_centavos,
                        sexo,
                        escolaridade,
                    )
                    if chave_dedup in registros_vistos:
                        descartados["duplicata_no_arquivo"] += 1
                        continue
                    registros_vistos.add(chave_dedup)

                    if municipio_codigo not in municipios_vistos:
                        municipios_vistos.add(municipio_codigo)
                        lote_municipios.append(
                            (
                                municipio_codigo,
                                municipio_nome,
                                uf_codigo,
                                uf_nome,
                                regiao_codigo,
                                regiao_nome,
                            )
                        )

                    chave_atividade = (cnae_subclasse, act_codigo)
                    if chave_atividade not in atividades_vistas:
                        atividades_vistas.add(chave_atividade)
                        classe_nome = consultar_catalogo_ibge("classes", cnae_classe, cache_classes)
                        subclasse_nome = consultar_catalogo_ibge(
                            "subclasses", cnae_subclasse, cache_subclasses
                        )
                        lote_atividades.append(
                            (
                                cnae_subclasse,
                                act_codigo,
                                cnae_classe,
                                act_nome,
                                classe_nome,
                                subclasse_nome,
                            )
                        )

                    lote_empregos.append(
                        (
                            arquivo_id,
                            linha_origem,
                            ano_referencia,
                            municipio_codigo,
                            cnae_subclasse,
                            act_codigo,
                            regiao_turistica,
                            mes_admissao,
                            remuneracao_centavos,
                            sexo,
                            escolaridade,
                        )
                    )
                    aceitos += 1

                    if len(lote_empregos) >= 10000:
                        conexao.executemany(
                            """
                            INSERT OR IGNORE INTO municipios (
                                municipio_codigo, municipio_nome, uf_codigo, uf_nome, regiao_codigo, regiao_nome
                            ) VALUES (?, ?, ?, ?, ?, ?);
                            """,
                            lote_municipios,
                        )
                        conexao.executemany(
                            """
                            INSERT OR IGNORE INTO atividades (
                                cnae_subclasse, act_codigo, cnae_classe, act_nome, cnae_classe_nome, cnae_subclasse_nome
                            ) VALUES (?, ?, ?, ?, ?, ?);
                            """,
                            lote_atividades,
                        )
                        conexao.executemany(
                            """
                            INSERT INTO empregos_turismo (
                                arquivo_id, linha_origem, ano_referencia, municipio_codigo,
                                cnae_subclasse, act_codigo, regiao_turistica, mes_admissao,
                                remuneracao_dezembro_centavos, sexo, escolaridade
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                            """,
                            lote_empregos,
                        )
                        lote_municipios.clear()
                        lote_atividades.clear()
                        lote_empregos.clear()

            if lote_municipios:
                conexao.executemany(
                    """
                    INSERT OR IGNORE INTO municipios (
                        municipio_codigo, municipio_nome, uf_codigo, uf_nome, regiao_codigo, regiao_nome
                    ) VALUES (?, ?, ?, ?, ?, ?);
                    """,
                    lote_municipios,
                )
            if lote_atividades:
                conexao.executemany(
                    """
                    INSERT OR IGNORE INTO atividades (
                        cnae_subclasse, act_codigo, cnae_classe, act_nome, cnae_classe_nome, cnae_subclasse_nome
                    ) VALUES (?, ?, ?, ?, ?, ?);
                    """,
                    lote_atividades,
                )
            if lote_empregos:
                conexao.executemany(
                    """
                    INSERT INTO empregos_turismo (
                        arquivo_id, linha_origem, ano_referencia, municipio_codigo,
                        cnae_subclasse, act_codigo, regiao_turistica, mes_admissao,
                        remuneracao_dezembro_centavos, sexo, escolaridade
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    lote_empregos,
                )

        total_descartados = sum(descartados.values())
        print("=== RESUMO DA EXECUÇÃO DO ETL ===")
        print(f"Arquivo processado : {caminho_csv.name}")
        print(f"Registros lidos    : {lidos}")
        print(f"Registros aceitos  : {aceitos}")
        print(f"Registros descart. : {total_descartados}")
        for motivo, qtd in descartados.items():
            print(f"  - {motivo}: {qtd}")
        print(f"Banco SQLite gerado: {caminho_db}")
    finally:
        conexao.close()


if __name__ == "__main__":
    raiz_projeto = Path(__file__).resolve().parent.parent
    caminho_csv_padrao = Path(sys.argv[1]) if len(sys.argv) > 1 else raiz_projeto / "dados" / "RAIS_Turismo_2025.csv"
    caminho_db_padrao = Path(sys.argv[2]) if len(sys.argv) > 2 else raiz_projeto / "dados" / "turismo.db"
    caminho_schema_padrao = raiz_projeto / "dados" / "schema.sql"
    executar_etl(caminho_csv_padrao, caminho_db_padrao, caminho_schema_padrao)