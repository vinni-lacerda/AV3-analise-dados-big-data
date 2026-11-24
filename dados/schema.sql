PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE arquivos_importados (
    arquivo_id INTEGER PRIMARY KEY,
    nome_arquivo TEXT NOT NULL,
    sha256 TEXT NOT NULL UNIQUE,
    importado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE municipios (
    municipio_codigo TEXT PRIMARY KEY NOT NULL,
    municipio_nome TEXT NOT NULL,
    uf_codigo TEXT NOT NULL,
    uf_nome TEXT NOT NULL,
    regiao_codigo TEXT NOT NULL,
    regiao_nome TEXT NOT NULL
);

CREATE TABLE atividades (
    cnae_subclasse TEXT NOT NULL,
    act_codigo TEXT NOT NULL,
    cnae_classe TEXT NOT NULL,
    act_nome TEXT NOT NULL,
    -- Nomes preenchidos a partir do catálogo CNAE do IBGE durante o ETL.
    cnae_classe_nome TEXT,
    cnae_subclasse_nome TEXT,
    PRIMARY KEY (cnae_subclasse, act_codigo)
);

CREATE TABLE empregos_turismo (
    arquivo_id INTEGER NOT NULL REFERENCES arquivos_importados (arquivo_id),
    linha_origem INTEGER NOT NULL CHECK (linha_origem >= 1),
    ano_referencia INTEGER NOT NULL,
    municipio_codigo TEXT NOT NULL REFERENCES municipios (municipio_codigo),
    cnae_subclasse TEXT NOT NULL,
    act_codigo TEXT NOT NULL,
    regiao_turistica TEXT,
    mes_admissao INTEGER CHECK (mes_admissao BETWEEN 1 AND 12),
    remuneracao_dezembro_centavos INTEGER,
    sexo TEXT,
    escolaridade TEXT,
    PRIMARY KEY (arquivo_id, linha_origem),
    FOREIGN KEY (cnae_subclasse, act_codigo) REFERENCES atividades (cnae_subclasse, act_codigo)
);

CREATE INDEX idx_empregos_ano_municipio_mes
    ON empregos_turismo (ano_referencia, municipio_codigo, mes_admissao);

CREATE INDEX idx_empregos_atividade_ano
    ON empregos_turismo (cnae_subclasse, act_codigo, ano_referencia);

COMMIT;
