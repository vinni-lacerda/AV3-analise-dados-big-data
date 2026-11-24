export const SCHEMA_COLUMNS = [
  { key: 'Id', label: 'Id', type: 'INTEGER', category: 'Identificação', desc: 'Identificador único do vínculo ativo na base tratada.' },
  { key: 'Municipio_Codigo', label: 'Municipio_Codigo', type: 'VARCHAR(7)', category: 'Geografia', desc: 'Código IBGE do município do estabelecimento empregador.' },
  { key: 'Municipio', label: 'Municipio', type: 'VARCHAR(100)', category: 'Geografia', desc: 'Nome oficial do município brasileiro.' },
  { key: 'UF_Codigo', label: 'UF_Codigo', type: 'VARCHAR(2)', category: 'Geografia', desc: 'Código numérico IBGE da Unidade da Federação.' },
  { key: 'UF', label: 'UF', type: 'CHAR(2)', category: 'Geografia', desc: 'Sigla da Unidade da Federação (Ex: SP, BA, RJ).' },
  { key: 'Regiao_Codigo', label: 'Regiao_Codigo', type: 'INTEGER', category: 'Geografia', desc: 'Código da Grande Região IBGE (1 a 5).' },
  { key: 'Regiao_UF', label: 'Regiao_UF', type: 'VARCHAR(20)', category: 'Geografia', desc: 'Nome da Macrorregião (Norte, Nordeste, Sudeste, Sul, Centro-Oeste).' },
  { key: 'Regiao_Turistica', label: 'Regiao_Turistica', type: 'VARCHAR(120)', category: 'Turismo', desc: 'Região Turística conforme o Mapa do Turismo Brasileiro (MTur).' },
  { key: 'CNAE_2.0_Classe', label: 'CNAE_2.0_Classe', type: 'VARCHAR(10)', category: 'Atividade', desc: 'Código e descrição da Classe CNAE 2.0 (4 dígitos).' },
  { key: 'CNAE_2.0_Subclasse', label: 'CNAE_2.0_Subclasse', type: 'VARCHAR(150)', category: 'Atividade', desc: 'Código e descrição detalhada da Subclasse CNAE 2.0 (7 dígitos).' },
  { key: 'Idade', label: 'Idade', type: 'INTEGER', category: 'Demografia', desc: 'Idade do trabalhador em anos completos em 31/12/2025.' },
  { key: 'Sexo', label: 'Sexo', type: 'VARCHAR(15)', category: 'Demografia', desc: 'Sexo biológico registrado na RAIS (Masculino / Feminino).' },
  { key: 'Raca_Cor', label: 'Raca_Cor', type: 'VARCHAR(20)', category: 'Demografia', desc: 'Autodeclaração de raça ou cor (Branca, Parda, Preta, Amarela, Indígena).' },
  { key: 'Escolaridade_Codigo', label: 'Escolaridade_Codigo', type: 'INTEGER', category: 'Demografia', desc: 'Código numérico do grau de instrução na RAIS (1 a 11).' },
  { key: 'Escolaridade_Rotulo', label: 'Escolaridade_Rotulo', type: 'VARCHAR(60)', category: 'Demografia', desc: 'Descrição do nível de escolaridade do trabalhador.' },
  { key: 'Qtd_Horas_Contratadas', label: 'Qtd_Horas_Contratadas', type: 'INTEGER', category: 'Vínculo', desc: 'Carga horária semanal contratada em horas.' },
  { key: 'Mes_Admissao', label: 'Mes_Admissao', type: 'INTEGER', category: 'Sazonalidade', desc: 'Mês de admissão do vínculo (1 = Janeiro a 12 = Dezembro, 0 = Anos anteriores).' },
  { key: 'Tempo_Emprego', label: 'Tempo_Emprego', type: 'DECIMAL(6,1)', category: 'Vínculo', desc: 'Tempo acumulado de emprego no vínculo em meses.' },
  { key: 'Remuneracao_Dezembro', label: 'Remuneracao_Dezembro', type: 'DECIMAL(10,2)', category: 'Remuneração', desc: 'Remuneração nominal recebida em Dezembro de 2025 (R$).' },
  { key: 'ACT_Codigo', label: 'ACT_Codigo', type: 'INTEGER', category: 'Turismo', desc: 'Código da Atividade Característica do Turismo (1 a 8).' },
  { key: 'ACT', label: 'ACT', type: 'VARCHAR(50)', category: 'Turismo', desc: 'Nome das 8 ACTs oficiais definidas pelo MTur.' }
];

export const MESES_NOMES = {
  0: 'Anterior a 2025',
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro'
};

export const ACTS_OFICIAIS = [
  'Alojamento',
  'Alimentação',
  'Transporte Terrestre',
  'Transporte Aquaviário',
  'Transporte Aéreo',
  'Aluguel de Transporte',
  'Agências de Viagem',
  'Cultura e Lazer'
];

// ============================================================================
// 2. DATASET MOCKADO REALISTA (42 REGISTROS COM TODAS AS 21 COLUNAS)
// ============================================================================
export const MOCK_TOURISM_DATA = [
  {
    Id: 1001, Municipio_Codigo: '3550308', Municipio: 'São Paulo', UF_Codigo: '35', UF: 'SP',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Capital Expandida',
    'CNAE_2.0_Classe': '5111-1', 'CNAE_2.0_Subclasse': '5111-1/00 - Transporte aéreo de passageiros regular',
    Idade: 34, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 11, Tempo_Emprego: 14.5, Remuneracao_Dezembro: 8450.00,
    ACT_Codigo: 5, ACT: 'Transporte Aéreo'
  },
  {
    Id: 1002, Municipio_Codigo: '3550308', Municipio: 'São Paulo', UF_Codigo: '35', UF: 'SP',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Capital Expandida',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 29, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 10, Tempo_Emprego: 2.3, Remuneracao_Dezembro: 3120.50,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1003, Municipio_Codigo: '3550308', Municipio: 'São Paulo', UF_Codigo: '35', UF: 'SP',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Capital Expandida',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/01 - Restaurantes e similares',
    Idade: 26, Sexo: 'Feminino', Raca_Cor: 'Preta', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.5, Remuneracao_Dezembro: 2480.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1004, Municipio_Codigo: '3550308', Municipio: 'São Paulo', UF_Codigo: '35', UF: 'SP',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Capital Expandida',
    'CNAE_2.0_Classe': '7911-2', 'CNAE_2.0_Subclasse': '7911-2/00 - Agências de viagens',
    Idade: 31, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 6, Tempo_Emprego: 6.2, Remuneracao_Dezembro: 4290.00,
    ACT_Codigo: 7, ACT: 'Agências de Viagem'
  },
  {
    Id: 1005, Municipio_Codigo: '3304557', Municipio: 'Rio de Janeiro', UF_Codigo: '33', UF: 'RJ',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Metropolitana',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 38, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 8, Escolaridade_Rotulo: 'Superior Incompleto',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.8, Remuneracao_Dezembro: 3450.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1006, Municipio_Codigo: '3304557', Municipio: 'Rio de Janeiro', UF_Codigo: '33', UF: 'RJ',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Metropolitana',
    'CNAE_2.0_Classe': '5011-4', 'CNAE_2.0_Subclasse': '5011-4/02 - Transporte marítimo de cabotagem - Passageiros',
    Idade: 42, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 12, Tempo_Emprego: 0.9, Remuneracao_Dezembro: 7650.00,
    ACT_Codigo: 4, ACT: 'Transporte Aquaviário'
  },
  {
    Id: 1007, Municipio_Codigo: '3304557', Municipio: 'Rio de Janeiro', UF_Codigo: '33', UF: 'RJ',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Metropolitana',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/04 - Bares e outros estabelecimentos especializados em servir bebidas',
    Idade: 24, Sexo: 'Feminino', Raca_Cor: 'Preta', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 12, Tempo_Emprego: 0.8, Remuneracao_Dezembro: 2390.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1008, Municipio_Codigo: '3304557', Municipio: 'Rio de Janeiro', UF_Codigo: '33', UF: 'RJ',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Metropolitana',
    'CNAE_2.0_Classe': '9321-2', 'CNAE_2.0_Subclasse': '9321-2/00 - Parques de diversão e parques temáticos',
    Idade: 27, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 36, Mes_Admissao: 1, Tempo_Emprego: 11.4, Remuneracao_Dezembro: 2610.00,
    ACT_Codigo: 8, ACT: 'Cultura e Lazer'
  },
  {
    Id: 1009, Municipio_Codigo: '2927408', Municipio: 'Salvador', UF_Codigo: '29', UF: 'BA',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Baía de Todos-os-Santos',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 33, Sexo: 'Feminino', Raca_Cor: 'Preta', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.6, Remuneracao_Dezembro: 2680.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1010, Municipio_Codigo: '2927408', Municipio: 'Salvador', UF_Codigo: '29', UF: 'BA',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Baía de Todos-os-Santos',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/01 - Restaurantes e similares',
    Idade: 28, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 6, Escolaridade_Rotulo: 'Médio Incompleto',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 12, Tempo_Emprego: 0.7, Remuneracao_Dezembro: 2150.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1011, Municipio_Codigo: '2927408', Municipio: 'Salvador', UF_Codigo: '29', UF: 'BA',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Baía de Todos-os-Santos',
    'CNAE_2.0_Classe': '4929-9', 'CNAE_2.0_Subclasse': '4929-9/02 - Transporte rodoviário coletivo de passageiros, sob regime de fretamento, intermunicipal',
    Idade: 45, Sexo: 'Masculino', Raca_Cor: 'Preta', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 1, Tempo_Emprego: 11.2, Remuneracao_Dezembro: 3390.00,
    ACT_Codigo: 3, ACT: 'Transporte Terrestre'
  },
  {
    Id: 1012, Municipio_Codigo: '2925303', Municipio: 'Porto Seguro', UF_Codigo: '29', UF: 'BA',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Costa do Descobrimento',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 25, Sexo: 'Feminino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.4, Remuneracao_Dezembro: 2890.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1013, Municipio_Codigo: '2925303', Municipio: 'Porto Seguro', UF_Codigo: '29', UF: 'BA',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Costa do Descobrimento',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/01 - Restaurantes e similares',
    Idade: 22, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 12, Tempo_Emprego: 0.9, Remuneracao_Dezembro: 2540.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1014, Municipio_Codigo: '2925303', Municipio: 'Porto Seguro', UF_Codigo: '29', UF: 'BA',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Costa do Descobrimento',
    'CNAE_2.0_Classe': '7912-1', 'CNAE_2.0_Subclasse': '7912-1/00 - Operadores turísticos',
    Idade: 30, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 10, Tempo_Emprego: 2.5, Remuneracao_Dezembro: 3780.00,
    ACT_Codigo: 7, ACT: 'Agências de Viagem'
  },
  {
    Id: 1015, Municipio_Codigo: '4309100', Municipio: 'Gramado', UF_Codigo: '43', UF: 'RS',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Hortênsias',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 32, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 10, Tempo_Emprego: 2.8, Remuneracao_Dezembro: 3680.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1016, Municipio_Codigo: '4309100', Municipio: 'Gramado', UF_Codigo: '43', UF: 'RS',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Hortênsias',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/01 - Restaurantes e similares',
    Idade: 27, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 6, Tempo_Emprego: 6.4, Remuneracao_Dezembro: 3420.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1017, Municipio_Codigo: '4309100', Municipio: 'Gramado', UF_Codigo: '43', UF: 'RS',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Hortênsias',
    'CNAE_2.0_Classe': '9321-2', 'CNAE_2.0_Subclasse': '9321-2/00 - Parques de diversão e parques temáticos',
    Idade: 23, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 8, Escolaridade_Rotulo: 'Superior Incompleto',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.7, Remuneracao_Dezembro: 3190.00,
    ACT_Codigo: 8, ACT: 'Cultura e Lazer'
  },
  {
    Id: 1018, Municipio_Codigo: '4108304', Municipio: 'Foz do Iguaçu', UF_Codigo: '41', UF: 'PR',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Cataratas do Iguaçu e Caminhos ao Lago de Itaipu',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 35, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 7, Tempo_Emprego: 5.5, Remuneracao_Dezembro: 3180.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1019, Municipio_Codigo: '4108304', Municipio: 'Foz do Iguaçu', UF_Codigo: '41', UF: 'PR',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Cataratas do Iguaçu e Caminhos ao Lago de Itaipu',
    'CNAE_2.0_Classe': '7911-2', 'CNAE_2.0_Subclasse': '7911-2/00 - Agências de viagens',
    Idade: 29, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 11, Tempo_Emprego: 1.9, Remuneracao_Dezembro: 3890.00,
    ACT_Codigo: 7, ACT: 'Agências de Viagem'
  },
  {
    Id: 1020, Municipio_Codigo: '4205407', Municipio: 'Florianópolis', UF_Codigo: '42', UF: 'SC',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Grande Florianópolis',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 26, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 8, Escolaridade_Rotulo: 'Superior Incompleto',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.5, Remuneracao_Dezembro: 3340.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1021, Municipio_Codigo: '4205407', Municipio: 'Florianópolis', UF_Codigo: '42', UF: 'SC',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Grande Florianópolis',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/01 - Restaurantes e similares',
    Idade: 24, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 12, Tempo_Emprego: 0.8, Remuneracao_Dezembro: 2980.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1022, Municipio_Codigo: '4205407', Municipio: 'Florianópolis', UF_Codigo: '42', UF: 'SC',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Grande Florianópolis',
    'CNAE_2.0_Classe': '7711-0', 'CNAE_2.0_Subclasse': '7711-0/00 - Locação de automóveis sem condutor',
    Idade: 31, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.6, Remuneracao_Dezembro: 3560.00,
    ACT_Codigo: 6, ACT: 'Aluguel de Transporte'
  },
  {
    Id: 1023, Municipio_Codigo: '2304400', Municipio: 'Fortaleza', UF_Codigo: '23', UF: 'CE',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Fortaleza',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 34, Sexo: 'Feminino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 7, Tempo_Emprego: 5.8, Remuneracao_Dezembro: 2590.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1024, Municipio_Codigo: '2304400', Municipio: 'Fortaleza', UF_Codigo: '23', UF: 'CE',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Fortaleza',
    'CNAE_2.0_Classe': '5111-1', 'CNAE_2.0_Subclasse': '5111-1/00 - Transporte aéreo de passageiros regular',
    Idade: 37, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 36, Mes_Admissao: 0, Tempo_Emprego: 42.0, Remuneracao_Dezembro: 7890.00,
    ACT_Codigo: 5, ACT: 'Transporte Aéreo'
  },
  {
    Id: 1025, Municipio_Codigo: '2611606', Municipio: 'Recife', UF_Codigo: '26', UF: 'PE',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Recife',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/01 - Restaurantes e similares',
    Idade: 29, Sexo: 'Feminino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.5, Remuneracao_Dezembro: 2290.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1026, Municipio_Codigo: '2611606', Municipio: 'Recife', UF_Codigo: '26', UF: 'PE',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Recife',
    'CNAE_2.0_Classe': '7711-0', 'CNAE_2.0_Subclasse': '7711-0/00 - Locação de automóveis sem condutor',
    Idade: 33, Sexo: 'Masculino', Raca_Cor: 'Preta', Escolaridade_Codigo: 8, Escolaridade_Rotulo: 'Superior Incompleto',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 6, Tempo_Emprego: 6.1, Remuneracao_Dezembro: 3150.00,
    ACT_Codigo: 6, ACT: 'Aluguel de Transporte'
  },
  {
    Id: 1027, Municipio_Codigo: '1302603', Municipio: 'Manaus', UF_Codigo: '13', UF: 'AM',
    Regiao_Codigo: 1, Regiao_UF: 'Norte', Regiao_Turistica: 'Manaus e Entorno',
    'CNAE_2.0_Classe': '5022-0', 'CNAE_2.0_Subclasse': '5022-0/02 - Transporte por navegação interior de passageiros em linhas regulares, intermunicipal',
    Idade: 41, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 5, Tempo_Emprego: 7.4, Remuneracao_Dezembro: 3920.00,
    ACT_Codigo: 4, ACT: 'Transporte Aquaviário'
  },
  {
    Id: 1028, Municipio_Codigo: '1302603', Municipio: 'Manaus', UF_Codigo: '13', UF: 'AM',
    Regiao_Codigo: 1, Regiao_UF: 'Norte', Regiao_Turistica: 'Manaus e Entorno',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 28, Sexo: 'Feminino', Raca_Cor: 'Indígena', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 10, Tempo_Emprego: 2.4, Remuneracao_Dezembro: 2640.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1029, Municipio_Codigo: '5002209', Municipio: 'Bonito', UF_Codigo: '50', UF: 'MS',
    Regiao_Codigo: 5, Regiao_UF: 'Centro-Oeste', Regiao_Turistica: 'Bonito-Serra da Bodoquena',
    'CNAE_2.0_Classe': '7912-1', 'CNAE_2.0_Subclasse': '7912-1/00 - Operadores turísticos',
    Idade: 27, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 11, Tempo_Emprego: 1.8, Remuneracao_Dezembro: 3980.00,
    ACT_Codigo: 7, ACT: 'Agências de Viagem'
  },
  {
    Id: 1030, Municipio_Codigo: '5002209', Municipio: 'Bonito', UF_Codigo: '50', UF: 'MS',
    Regiao_Codigo: 5, Regiao_UF: 'Centro-Oeste', Regiao_Turistica: 'Bonito-Serra da Bodoquena',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/02 - Apart-hotéis',
    Idade: 31, Sexo: 'Feminino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 12, Tempo_Emprego: 0.9, Remuneracao_Dezembro: 3250.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1031, Municipio_Codigo: '2408102', Municipio: 'Natal', UF_Codigo: '24', UF: 'RN',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Polo Costa das Dunas',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 35, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.6, Remuneracao_Dezembro: 2710.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1032, Municipio_Codigo: '2408102', Municipio: 'Natal', UF_Codigo: '24', UF: 'RN',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Polo Costa das Dunas',
    'CNAE_2.0_Classe': '4929-9', 'CNAE_2.0_Subclasse': '4929-9/01 - Transporte rodoviário coletivo de passageiros, sob regime de fretamento, municipal',
    Idade: 39, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 12, Tempo_Emprego: 0.7, Remuneracao_Dezembro: 3090.00,
    ACT_Codigo: 3, ACT: 'Transporte Terrestre'
  },
  {
    Id: 1033, Municipio_Codigo: '3106200', Municipio: 'Belo Horizonte', UF_Codigo: '31', UF: 'MG',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Belo Horizonte',
    'CNAE_2.0_Classe': '5611-2', 'CNAE_2.0_Subclasse': '5611-2/04 - Bares e outros estabelecimentos especializados em servir bebidas',
    Idade: 25, Sexo: 'Feminino', Raca_Cor: 'Preta', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 10, Tempo_Emprego: 2.3, Remuneracao_Dezembro: 2320.00,
    ACT_Codigo: 2, ACT: 'Alimentação'
  },
  {
    Id: 1034, Municipio_Codigo: '3106200', Municipio: 'Belo Horizonte', UF_Codigo: '31', UF: 'MG',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Belo Horizonte',
    'CNAE_2.0_Classe': '7711-0', 'CNAE_2.0_Subclasse': '7711-0/00 - Locação de automóveis sem condutor',
    Idade: 36, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 0, Tempo_Emprego: 36.5, Remuneracao_Dezembro: 4850.00,
    ACT_Codigo: 6, ACT: 'Aluguel de Transporte'
  },
  {
    Id: 1035, Municipio_Codigo: '4106902', Municipio: 'Curitiba', UF_Codigo: '41', UF: 'PR',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Rotas do Pinhão',
    'CNAE_2.0_Classe': '4922-1', 'CNAE_2.0_Subclasse': '4922-1/02 - Transporte rodoviário coletivo de passageiros, com itinerário fixo, interestadual',
    Idade: 44, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 3, Tempo_Emprego: 9.2, Remuneracao_Dezembro: 4120.00,
    ACT_Codigo: 3, ACT: 'Transporte Terrestre'
  },
  {
    Id: 1036, Municipio_Codigo: '4106902', Municipio: 'Curitiba', UF_Codigo: '41', UF: 'PR',
    Regiao_Codigo: 4, Regiao_UF: 'Sul', Regiao_Turistica: 'Rotas do Pinhão',
    'CNAE_2.0_Classe': '9001-9', 'CNAE_2.0_Subclasse': '9001-9/01 - Produção teatral',
    Idade: 30, Sexo: 'Feminino', Raca_Cor: 'Amarela', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 30, Mes_Admissao: 8, Tempo_Emprego: 4.1, Remuneracao_Dezembro: 3690.00,
    ACT_Codigo: 8, ACT: 'Cultura e Lazer'
  },
  {
    Id: 1037, Municipio_Codigo: '5300108', Municipio: 'Brasília', UF_Codigo: '53', UF: 'DF',
    Regiao_Codigo: 5, Regiao_UF: 'Centro-Oeste', Regiao_Turistica: 'Brasília',
    'CNAE_2.0_Classe': '5111-1', 'CNAE_2.0_Subclasse': '5111-1/00 - Transporte aéreo de passageiros regular',
    Idade: 39, Sexo: 'Feminino', Raca_Cor: 'Branca', Escolaridade_Codigo: 10, Escolaridade_Rotulo: 'Pós-Graduação / Mestrado',
    Qtd_Horas_Contratadas: 36, Mes_Admissao: 0, Tempo_Emprego: 64.0, Remuneracao_Dezembro: 9420.00,
    ACT_Codigo: 5, ACT: 'Transporte Aéreo'
  },
  {
    Id: 1038, Municipio_Codigo: '5300108', Municipio: 'Brasília', UF_Codigo: '53', UF: 'DF',
    Regiao_Codigo: 5, Regiao_UF: 'Centro-Oeste', Regiao_Turistica: 'Brasília',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 32, Sexo: 'Masculino', Raca_Cor: 'Parda', Escolaridade_Codigo: 8, Escolaridade_Rotulo: 'Superior Incompleto',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 9, Tempo_Emprego: 3.4, Remuneracao_Dezembro: 3580.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1039, Municipio_Codigo: '2704302', Municipio: 'Maceió', UF_Codigo: '27', UF: 'AL',
    Regiao_Codigo: 2, Regiao_UF: 'Nordeste', Regiao_Turistica: 'Metropolitana de Maceió',
    'CNAE_2.0_Classe': '5510-8', 'CNAE_2.0_Subclasse': '5510-8/01 - Hotéis',
    Idade: 26, Sexo: 'Feminino', Raca_Cor: 'Parda', Escolaridade_Codigo: 7, Escolaridade_Rotulo: 'Médio Completo',
    Qtd_Horas_Contratadas: 44, Mes_Admissao: 11, Tempo_Emprego: 1.5, Remuneracao_Dezembro: 2620.00,
    ACT_Codigo: 1, ACT: 'Alojamento'
  },
  {
    Id: 1040, Municipio_Codigo: '3550308', Municipio: 'São Paulo', UF_Codigo: '35', UF: 'SP',
    Regiao_Codigo: 3, Regiao_UF: 'Sudeste', Regiao_Turistica: 'Capital Expandida',
    'CNAE_2.0_Classe': '5112-9', 'CNAE_2.0_Subclasse': '5112-9/01 - Serviço de táxi aéreo e locação de aeronaves com tripulação',
    Idade: 46, Sexo: 'Masculino', Raca_Cor: 'Branca', Escolaridade_Codigo: 9, Escolaridade_Rotulo: 'Superior Completo',
    Qtd_Horas_Contratadas: 40, Mes_Admissao: 2, Tempo_Emprego: 10.3, Remuneracao_Dezembro: 11250.00,
    ACT_Codigo: 5, ACT: 'Transporte Aéreo'
  }
];

// ============================================================================
// 3. ESTRUTURA INICIAL DAS 6 PERGUNTAS DE PESQUISA (BIG DATA Q&A)
// ============================================================================
export const INITIAL_QUESTIONS = [
  {
    id: 'q1',
    number: 1,
    title: 'Quais cidades têm mais empregos de turismo?',
    tag: 'Volumetria Geográfica',
    methodology: 'Agrupamento (GROUP BY Municipio, UF) com contagem de vínculos ativos (COUNT(Id)) ordenada decrescentemente.',
    defaultAnswer: '',
    defaultQuery: 'SELECT Municipio, UF, COUNT(Id) AS Total_Vinculos FROM rais_turismo_2025 GROUP BY Municipio, UF ORDER BY Total_Vinculos DESC LIMIT 15;'
  },
  {
    id: 'q2',
    number: 2,
    title: 'Quais meses é contratado mais gente?',
    tag: 'Análise de Sazonalidade',
    methodology: 'Distribuição temporal filtrando admissões ocorridas em 2025 (Mes_Admissao BETWEEN 1 AND 12) para identificar picos sazonais.',
    defaultAnswer: '',
    defaultQuery: 'SELECT Mes_Admissao, COUNT(Id) AS Novas_Admissoes FROM rais_turismo_2025 WHERE Mes_Admissao > 0 GROUP BY Mes_Admissao ORDER BY Novas_Admissoes DESC;'
  },
  {
    id: 'q3',
    number: 3,
    title: 'Qual cidade dá mais dinheiro no turismo?',
    tag: 'Renda & Massa Salarial',
    methodology: 'Cálculo da remuneração média (AVG(Remuneracao_Dezembro)) e mediana salarial por município, controlando por carga horária.',
    defaultAnswer: '',
    defaultQuery: 'SELECT Municipio, UF, ROUND(AVG(Remuneracao_Dezembro), 2) AS Media_Salarial, SUM(Remuneracao_Dezembro) AS Massa_Salarial FROM rais_turismo_2025 GROUP BY Municipio, UF HAVING COUNT(Id) >= 50 ORDER BY Media_Salarial DESC;'
  },
  {
    id: 'q4',
    number: 4,
    title: 'Qual CNAE tem mais remuneração?',
    tag: 'Especialização Setorial',
    methodology: 'Agregação por CNAE_2.0_Subclasse e ACT comparando média salarial em Dezembro e horas contratadas.',
    defaultAnswer: '',
    defaultQuery: 'SELECT `CNAE_2.0_Subclasse`, ACT, ROUND(AVG(Remuneracao_Dezembro), 2) AS Remuneracao_Media FROM rais_turismo_2025 GROUP BY `CNAE_2.0_Subclasse`, ACT ORDER BY Remuneracao_Media DESC LIMIT 10;'
  },
  {
    id: 'q5',
    number: 5,
    title: 'Quais cidades valem a pena se mudar para conseguir um dinheiro em algum mês no turismo?',
    tag: 'Índice de Oportunidade Sazonal',
    methodology: 'Cruzamento entre volume de admissões sazonais (Mes_Admissao) + remuneração média acima da média nacional por município.',
    defaultAnswer: '',
    defaultQuery: 'SELECT Municipio, UF, Mes_Admissao, COUNT(Id) AS Vagas_Mes, ROUND(AVG(Remuneracao_Dezembro), 2) AS Media_Salarial FROM rais_turismo_2025 WHERE Mes_Admissao IN (10, 11, 12, 1, 6, 7) GROUP BY Municipio, UF, Mes_Admissao ORDER BY Vagas_Mes DESC, Media_Salarial DESC;'
  },
  {
    id: 'q6',
    number: 6,
    title: 'Qual CNAE tem mais emprego a partir de cada CNAE?',
    tag: 'Hierarquia CNAE & ACT',
    methodology: 'Análise hierárquica comparando o volume de empregos entre Classes CNAE 2.0 (4 dígitos) e suas respectivas Subclasses (7 dígitos) dentro de cada ACT.',
    defaultAnswer: '',
    defaultQuery: 'SELECT ACT, `CNAE_2.0_Classe`, `CNAE_2.0_Subclasse`, COUNT(Id) AS Vinculos, ROUND(COUNT(Id) * 100.0 / SUM(COUNT(Id)) OVER(PARTITION BY ACT), 2) AS Share_ACT_Pct FROM rais_turismo_2025 GROUP BY ACT, `CNAE_2.0_Classe`, `CNAE_2.0_Subclasse` ORDER BY ACT, Vinculos DESC;'
  }
];

// ============================================================================
// UTILITÁRIOS DE FORMATAÇÃO
// ============================================================================
// ============================================================================
// COMPONENTE PRINCIPAL

export const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
export const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0);
