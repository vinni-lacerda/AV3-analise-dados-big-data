import hashlib
import shutil
import sys
import tempfile
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from pathlib import Path

import polars as pl
import requests
from sqlalchemy import MetaData, create_engine, event, inspect, select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.engine import Connection, Engine

TAMANHO_LOTE = 10_000

COLUNAS_ORIGEM = [
    "Id",
    "Ano",
    "Municipio_Codigo",
    "Municipio",
    "UF_Codigo",
    "UF",
    "Regiao_Codigo",
    "Regiao_UF",
    "CNAE_2.0_Classe",
    "CNAE_2.0_Subclasse",
    "ACT_Codigo",
    "ACT",
    "Regiao_Turistica",
    "Mes_Admissao",
    "Remuneracao_Dezembro",
    "Sexo",
    "Escolaridade_Rotulo",
]

COLUNAS_OBRIGATORIAS = [
    "Ano",
    "Municipio_Codigo",
    "Municipio",
    "UF_Codigo",
    "UF",
    "Regiao_Codigo",
    "Regiao_UF",
    "CNAE_2.0_Classe",
    "CNAE_2.0_Subclasse",
    "ACT_Codigo",
    "ACT",
]

RENOMEAR = {
    "Municipio_Codigo": "municipio_codigo",
    "Municipio": "municipio_nome",
    "UF_Codigo": "uf_codigo",
    "UF": "uf_nome",
    "Regiao_Codigo": "regiao_codigo",
    "Regiao_UF": "regiao_nome",
    "CNAE_2.0_Classe": "cnae_classe",
    "CNAE_2.0_Subclasse": "cnae_subclasse",
    "ACT_Codigo": "act_codigo",
    "ACT": "act_nome",
    "Regiao_Turistica": "regiao_turistica",
    "Sexo": "sexo",
    "Escolaridade_Rotulo": "escolaridade",
}

CHAVE_DEDUP = [
    "Id",
    "ano_referencia",
    "municipio_codigo",
    "cnae_subclasse",
    "act_codigo",
    "mes_admissao",
    "remuneracao_dezembro_centavos",
    "sexo",
    "escolaridade",
]

COLUNAS_FINAIS = [
    "linha_origem",
    "ano_referencia",
    "municipio_codigo",
    "municipio_nome",
    "uf_codigo",
    "uf_nome",
    "regiao_codigo",
    "regiao_nome",
    "cnae_classe",
    "cnae_subclasse",
    "act_codigo",
    "act_nome",
    "regiao_turistica",
    "mes_admissao",
    "remuneracao_dezembro_centavos",
    "sexo",
    "escolaridade",
]


def calcular_sha256(caminho_arquivo: Path) -> str:
    hasher = hashlib.sha256()
    with caminho_arquivo.open("rb") as arquivo:
        for bloco in iter(lambda: arquivo.read(1024 * 1024), b""):
            hasher.update(bloco)
    return hasher.hexdigest()


def limpar_texto_py(valor: str | None) -> str | None:
    if valor is None:
        return None
    texto = " ".join(valor.strip().split())
    return texto if texto else None


def expr_limpar_texto(coluna: str) -> pl.Expr:
    texto = pl.col(coluna).cast(pl.Utf8).str.strip_chars().str.replace_all(r"\s+", " ")
    return pl.when(texto.str.len_chars() > 0).then(texto).otherwise(None).alias(coluna)


def expr_inteiro_estrito(coluna: str) -> pl.Expr:
    texto = pl.col(coluna)
    eh_inteiro = texto.str.contains(r"^\d+$")
    return pl.when(eh_inteiro).then(texto.cast(pl.Int64, strict=False))


def expr_float_finito(coluna: str, virgula_decimal: bool = True) -> pl.Expr:
    texto = pl.col(coluna)
    if virgula_decimal:
        texto = texto.str.replace_all(",", ".")
    valor = texto.cast(pl.Float64, strict=False)
    return pl.when(valor.is_finite()).then(valor)


def consultar_catalogo_ibge(endpoint: str, codigo: str) -> str | None:
    url = f"https://servicodados.ibge.gov.br/api/v2/cnae/{endpoint}/{codigo}"
    try:
        resposta = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=4)
        resposta.raise_for_status()
        dados = resposta.json()
        if isinstance(dados, list) and dados:
            descricao = dados[0].get("descricao")
        elif isinstance(dados, dict):
            descricao = dados.get("descricao")
        else:
            descricao = None
        return limpar_texto_py(descricao)
    except Exception:
        return None


def montar_catalogo(
    endpoint: str, codigos: list[str], max_workers: int = 8
) -> dict[str, str | None]:
    codigos_unicos = list(dict.fromkeys(codigos))
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        nomes = pool.map(lambda c: consultar_catalogo_ibge(endpoint, c), codigos_unicos)
        return dict(zip(codigos_unicos, nomes))


def detectar_encoding(caminho_csv: Path) -> str:
    try:
        with caminho_csv.open("r", encoding="utf-8-sig") as teste:
            while teste.read(65536):
                pass
        return "utf-8-sig"
    except UnicodeDecodeError:
        return "latin-1"


def detectar_delimitador(caminho_csv: Path, encoding: str) -> str:
    with caminho_csv.open("r", encoding=encoding, errors="replace") as arquivo:
        amostra = arquivo.readline()
    return ";" if amostra.count(";") > amostra.count(",") else ","


@contextmanager
def abrir_csv_lazy(
    caminho_csv: Path, encoding: str, delimitador: str
) -> Iterator[pl.LazyFrame]:
    pasta_tmp: str | None = None
    fonte = caminho_csv
    try:
        if encoding == "latin-1":
            pasta_tmp = tempfile.mkdtemp(prefix="etl_turismo_")
            fonte = Path(pasta_tmp) / "entrada_utf8.csv"
            with (
                caminho_csv.open("r", encoding="latin-1", newline="") as ent,
                fonte.open("w", encoding="utf-8", newline="") as sai,
            ):
                shutil.copyfileobj(ent, sai, length=1024 * 1024)

        lf = pl.scan_csv(
            fonte,
            separator=delimitador,
            infer_schema=False,
            truncate_ragged_lines=True,
        )

        nomes = lf.collect_schema().names()
        sem_bom = {n: n.lstrip("\ufeff") for n in nomes if n.startswith("\ufeff")}
        if sem_bom:
            lf = lf.rename(sem_bom)
            nomes = lf.collect_schema().names()

        obrigatorias_faltantes = [c for c in COLUNAS_OBRIGATORIAS if c not in nomes]
        if obrigatorias_faltantes:
            lista = ", ".join(obrigatorias_faltantes)
            raise ValueError(
                f"CSV inválido: colunas obrigatórias ausentes: {lista}"
            )

        opcionais_faltantes = [c for c in COLUNAS_ORIGEM if c not in nomes]
        if opcionais_faltantes:
            lf = lf.with_columns(
                [pl.lit(None, dtype=pl.Utf8).alias(c) for c in opcionais_faltantes]
            )

        yield lf.select(COLUNAS_ORIGEM)
    finally:
        if pasta_tmp:
            shutil.rmtree(pasta_tmp, ignore_errors=True)


def transformar(lf: pl.LazyFrame) -> tuple[pl.DataFrame, int, dict[str, int]]:
    ano_int = expr_inteiro_estrito("Ano")
    base = (
        lf.with_row_index("linha_origem", offset=1)
        .with_columns(pl.col("linha_origem").cast(pl.Int64))
        .with_columns([expr_limpar_texto(c) for c in COLUNAS_ORIGEM])
        .with_columns(
            pl.all_horizontal(pl.col(COLUNAS_OBRIGATORIAS).is_not_null()).alias(
                "_ok_obrigatorios"
            ),
            pl.when(ano_int.is_between(2000, 2100))
            .then(ano_int)
            .alias("ano_referencia"),
        )
    )

    lidos, sem_obrigatorios, ano_invalido = (
        base.select(
            pl.len().alias("lidos"),
            (~pl.col("_ok_obrigatorios")).sum().alias("sem_obrigatorios"),
            (pl.col("_ok_obrigatorios") & pl.col("ano_referencia").is_null())
            .sum()
            .alias("ano_invalido"),
        )
        .collect(engine="streaming")
        .row(0)
    )
    validos_antes_dedup = lidos - sem_obrigatorios - ano_invalido

    mes = expr_inteiro_estrito("Mes_Admissao")
    reais = expr_float_finito("Remuneracao_Dezembro")
    limpo = (
        base.filter(pl.col("_ok_obrigatorios") & pl.col("ano_referencia").is_not_null())
        .with_columns(
            pl.when(mes.is_between(1, 12)).then(mes).alias("mes_admissao"),
            pl.when(reais >= 0)
            .then(
                (reais * 100).round(0, mode="half_to_even").cast(pl.Int64, strict=False)
            )
            .alias("remuneracao_dezembro_centavos"),
        )
        .rename(RENOMEAR)
        .unique(subset=CHAVE_DEDUP, keep="first", maintain_order=True)
        .select(COLUNAS_FINAIS)
        .collect(engine="streaming")
    )

    descartados = {
        "campos_obrigatorios_ausentes": sem_obrigatorios,
        "ano_referencia_invalido": ano_invalido,
        "duplicata_no_arquivo": validos_antes_dedup - limpo.height,
    }
    return limpo, lidos, descartados


def montar_tabelas(df: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame, pl.DataFrame]:
    municipios = df.select(
        "municipio_codigo",
        "municipio_nome",
        "uf_codigo",
        "uf_nome",
        "regiao_codigo",
        "regiao_nome",
    ).unique(subset=["municipio_codigo"], keep="first", maintain_order=True)

    atividades = df.select(
        "cnae_subclasse", "act_codigo", "cnae_classe", "act_nome"
    ).unique(subset=["cnae_subclasse", "act_codigo"], keep="first", maintain_order=True)

    classes = montar_catalogo("classes", atividades["cnae_classe"].to_list())
    subclasses = montar_catalogo("subclasses", atividades["cnae_subclasse"].to_list())
    atividades = atividades.with_columns(
        pl.Series(
            "cnae_classe_nome",
            [classes[c] for c in atividades["cnae_classe"]],
            dtype=pl.Utf8,
        ),
        pl.Series(
            "cnae_subclasse_nome",
            [subclasses[c] for c in atividades["cnae_subclasse"]],
            dtype=pl.Utf8,
        ),
    )

    empregos = df.select(
        "linha_origem",
        "ano_referencia",
        "municipio_codigo",
        "cnae_subclasse",
        "act_codigo",
        "regiao_turistica",
        "mes_admissao",
        "remuneracao_dezembro_centavos",
        "sexo",
        "escolaridade",
    )
    return municipios, atividades, empregos


def criar_engine(caminho_db: Path) -> Engine:
    engine = create_engine(f"sqlite:///{caminho_db}")

    @event.listens_for(engine, "connect")
    def _ativar_fk(dbapi_conexao, _registro):
        cursor = dbapi_conexao.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.close()

    return engine


def inicializar_banco(engine: Engine, caminho_schema: Path) -> None:
    if not inspect(engine).has_table("empregos_turismo"):
        script_sql = caminho_schema.read_text(encoding="utf-8")
        bruta = engine.raw_connection()
        try:
            bruta.driver_connection.executescript(script_sql)
            bruta.commit()
        finally:
            bruta.close()


def inserir_em_lotes(conexao: Connection, comando, df: pl.DataFrame) -> None:
    if df.is_empty():
        return
    for fatia in df.iter_slices(n_rows=TAMANHO_LOTE):
        conexao.execute(comando, fatia.to_dicts())


def executar_etl(caminho_csv: Path, caminho_db: Path, caminho_schema: Path) -> None:
    if not caminho_csv.exists():
        raise FileNotFoundError(f"Arquivo CSV não encontrado: {caminho_csv}")
    if not caminho_schema.exists():
        raise FileNotFoundError(f"Schema SQL não encontrado: {caminho_schema}")

    caminho_db.parent.mkdir(parents=True, exist_ok=True)
    sha256_arquivo = calcular_sha256(caminho_csv)

    engine = criar_engine(caminho_db)
    try:
        inicializar_banco(engine, caminho_schema)

        metadata = MetaData()
        metadata.reflect(
            bind=engine,
            only=[
                "arquivos_importados",
                "municipios",
                "atividades",
                "empregos_turismo",
            ],
        )
        t_arquivos = metadata.tables["arquivos_importados"]
        t_municipios = metadata.tables["municipios"]
        t_atividades = metadata.tables["atividades"]
        t_empregos = metadata.tables["empregos_turismo"]

        with engine.connect() as conexao:
            ja_importado = conexao.execute(
                select(t_arquivos.c.arquivo_id, t_arquivos.c.nome_arquivo).where(
                    t_arquivos.c.sha256 == sha256_arquivo
                )
            ).first()
        if ja_importado:
            print(
                f"Arquivo já importado anteriormente (arquivo_id={ja_importado[0]}, "
                f"nome={ja_importado[1]}). Nenhuma alteração realizada."
            )
            return

        encoding = detectar_encoding(caminho_csv)
        delimitador = detectar_delimitador(caminho_csv, encoding)

        print(
            f"Lendo e limpando o CSV (encoding={encoding}, delimitador={delimitador!r})..."
        )
        with abrir_csv_lazy(caminho_csv, encoding, delimitador) as lf:
            limpo, lidos, descartados = transformar(lf)

        print("Consultando catálogo CNAE do IBGE...")
        municipios, atividades, empregos = montar_tabelas(limpo)
        del limpo
        aceitos = empregos.height

        print(f"Gravando {aceitos} registros no SQLite...")
        with engine.begin() as conexao:
            arquivo_id = conexao.execute(
                t_arquivos.insert().values(
                    nome_arquivo=caminho_csv.name, sha256=sha256_arquivo
                )
            ).inserted_primary_key[0]

            inserir_em_lotes(
                conexao,
                sqlite_insert(t_municipios).on_conflict_do_nothing(),
                municipios,
            )
            inserir_em_lotes(
                conexao,
                sqlite_insert(t_atividades).on_conflict_do_nothing(),
                atividades,
            )
            inserir_em_lotes(
                conexao,
                t_empregos.insert(),
                empregos.with_columns(pl.lit(arquivo_id).alias("arquivo_id")),
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
        engine.dispose()


if __name__ == "__main__":
    raiz_projeto = Path(__file__).resolve().parent.parent
    caminho_csv_padrao = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else raiz_projeto / "dados" / "RAIS_Turismo_2025.csv"
    )
    caminho_db_padrao = (
        Path(sys.argv[2])
        if len(sys.argv) > 2
        else raiz_projeto / "dados" / "turismo.db"
    )
    caminho_schema_padrao = raiz_projeto / "dados" / "schema.sql"
    executar_etl(caminho_csv_padrao, caminho_db_padrao, caminho_schema_padrao)