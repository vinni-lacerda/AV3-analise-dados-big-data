'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface SerieItem {
  ano: number;
  mes: number;
  total_admissoes: number;
}

interface PrevisaoItem {
  ano: number;
  mes: number;
  previsto: number;
  referencia: string;
}

interface ComparacaoItem {
  ano: number;
  mes: number;
  real: number;
  previsto: number;
  erro_absoluto: number;
}

interface PrevisaoData {
  disponivel: boolean;
  origem_dados?: 'csv_real' | 'mock_fallback';
  mensagem?: string;
  anos_disponiveis?: number[];
  metodo?: string;
  horizonte_meses?: number;
  serie_observada?: SerieItem[];
  previsoes?: PrevisaoItem[];
  backtesting?: {
    disponivel?: boolean;
    mae: number;
    total_meses_avaliados: number;
    comparacoes: ComparacaoItem[];
    observacao?: string | null;
  };
}

const NOMES_MESES: Record<number, string> = {
  1: 'Jan',
  2: 'Fev',
  3: 'Mar',
  4: 'Abr',
  5: 'Mai',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Set',
  10: 'Out',
  11: 'Nov',
  12: 'Dez',
};

const PESOS_2024 = [5, 4, 3, 2, 2, 3, 4, 2, 2, 3, 4, 6];
const PESOS_2025 = [6, 5, 3, 2, 3, 3, 5, 2, 3, 3, 4, 7];

function formatarMesAno(mes: number, ano: number): string {
  return `${NOMES_MESES[mes] ?? String(mes).padStart(2, '0')}/${ano}`;
}

function avancarMesAno(ano: number, mes: number, passos: number): { ano: number; mes: number } {
  const totalMeses = ano * 12 + (mes - 1) + passos;
  return {
    ano: Math.floor(totalMeses / 12),
    mes: (totalMeses % 12) + 1,
  };
}

function construirFallbackLocal(): PrevisaoData {
  const serie_observada: SerieItem[] = [
    ...PESOS_2024.map((v, idx) => ({ ano: 2024, mes: idx + 1, total_admissoes: v })),
    ...PESOS_2025.map((v, idx) => ({ ano: 2025, mes: idx + 1, total_admissoes: v })),
  ];

  const comparacoes: ComparacaoItem[] = PESOS_2025.map((real, idx) => {
    const previsto = PESOS_2024[idx];
    return {
      ano: 2025,
      mes: idx + 1,
      real,
      previsto,
      erro_absoluto: Math.abs(real - previsto),
    };
  });

  const mae = Number(
    (comparacoes.reduce((acc, item) => acc + item.erro_absoluto, 0) / comparacoes.length).toFixed(2)
  );

  return {
    disponivel: true,
    origem_dados: 'mock_fallback',
    metodo: 'Naive sazonal (mesmo mês do ano anterior)',
    horizonte_meses: 3,
    anos_disponiveis: [2024, 2025],
    serie_observada,
    previsoes: [],
    backtesting: {
      disponivel: true,
      mae,
      total_meses_avaliados: comparacoes.length,
      comparacoes,
      observacao: null,
    },
  };
}

export default function ForecastSection() {
  const [dados, setDados] = useState<PrevisaoData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [horizonteMeses, setHorizonteMeses] = useState<number>(3);

  useEffect(() => {
    let ativo = true;

    async function carregarPrevisao() {
      try {
        const resposta = await fetch('/previsao_sazonal.json', { cache: 'no-store' });
        if (!resposta.ok) {
          throw new Error('JSON ainda não gerado');
        }
        const texto = await resposta.text();
        if (!texto.trim()) {
          throw new Error('JSON vazio');
        }
        const json = JSON.parse(texto) as PrevisaoData;
        if (ativo) {
          setDados(json);
          if (json.horizonte_meses && json.horizonte_meses >= 1 && json.horizonte_meses <= 12) {
            setHorizonteMeses(json.horizonte_meses);
          }
        }
      } catch {
        if (ativo) {
          setDados(construirFallbackLocal());
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarPrevisao();
    return () => {
      ativo = false;
    };
  }, []);

  const calculadoPorHorizonte = useMemo(() => {
    if (!dados || !dados.disponivel) {
      return null;
    }

    const serieBase =
      dados.serie_observada && dados.serie_observada.length >= 12
        ? [...dados.serie_observada].sort((a, b) => a.ano - b.ano || a.mes - b.mes)
        : construirFallbackLocal().serie_observada!;

    const mapaSerie = new Map<string, number>();
    serieBase.forEach((item) => {
      mapaSerie.set(`${item.ano}-${item.mes}`, item.total_admissoes);
    });

    const ultimoPonto = serieBase[serieBase.length - 1];
    const previsoesDinamicas: PrevisaoItem[] = [];

    for (let passo = 1; passo <= horizonteMeses; passo++) {
      const alvo = avancarMesAno(ultimoPonto.ano, ultimoPonto.mes, passo);
      const ref = avancarMesAno(alvo.ano, alvo.mes, -12);
      const valorRef = mapaSerie.get(`${ref.ano}-${ref.mes}`) ?? 0;

      previsoesDinamicas.push({
        ano: alvo.ano,
        mes: alvo.mes,
        previsto: valorRef,
        referencia: `${String(ref.mes).padStart(2, '0')}/${ref.ano}`,
      });
    }

    const todasComparacoes = dados.backtesting?.comparacoes ?? [];
    const temBacktesting = todasComparacoes.length > 0;
    const comparacoesRecortadas = temBacktesting ? todasComparacoes.slice(-horizonteMeses) : [];
    const maeRecortado = temBacktesting
      ? Number(
          (
            comparacoesRecortadas.reduce((acc, item) => acc + item.erro_absoluto, 0) /
            comparacoesRecortadas.length
          ).toFixed(2)
        )
      : 0;

    return {
      previsoes: previsoesDinamicas,
      comparacoes: comparacoesRecortadas,
      temBacktesting,
      mae: maeRecortado,
      totalAvaliados: comparacoesRecortadas.length,
      observacaoBacktesting: dados.backtesting?.observacao ?? null,
    };
  }, [dados, horizonteMeses]);

  if (carregando) {
    return (
      <section className="space-y-4">
        <div className="border-t-2 border-teal-950 pt-4">
          <h2 className="text-xl font-bold text-teal-950">Previsão sazonal</h2>
          <p className="text-sm text-teal-800/80">Carregando série histórica e estimativas...</p>
        </div>
      </section>
    );
  }

  if (!dados) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-t-2 border-teal-950 pt-4">
        <div>
          <h2 className="text-xl font-bold text-teal-950">Previsão sazonal</h2>
          <p className="text-sm text-teal-800/80">
            Estimativa de admissões em empregos formais do setor turístico.
          </p>
        </div>
      </div>

      {!dados.disponivel || !calculadoPorHorizonte ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">{dados.mensagem}</p>
          {dados.anos_disponiveis && dados.anos_disponiveis.length > 0 && (
            <p className="mt-1 text-xs text-amber-800">
              Anos encontrados na base: {dados.anos_disponiveis.join(', ')}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-teal-950/15 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                Método de referência
              </p>
              <p className="mt-1 text-sm font-semibold text-teal-950">{dados.metodo}</p>
            </div>

            <div className="rounded-lg border border-teal-950/15 bg-white p-4">
              <label
                htmlFor="horizonte-projetado-select"
                className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700"
              >
                Horizonte projetado
              </label>
              <div className="mt-1 flex items-baseline gap-2">
                <select
                  id="horizonte-projetado-select"
                  value={horizonteMeses}
                  onChange={(e) => setHorizonteMeses(Number(e.target.value))}
                  className="cursor-pointer rounded-md border border-teal-950/20 bg-white px-2.5 py-1 text-xl font-bold text-teal-950 focus:border-teal-700 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, idx) => idx + 1).map((meses) => (
                    <option key={meses} value={meses}>
                      {meses} {meses === 1 ? 'mês' : 'meses'}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-teal-700">de 1 a 12 meses</span>
              </div>
            </div>

            <div className="rounded-lg border border-teal-950/15 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                Erro Absoluto Médio (MAE)
              </p>
              {calculadoPorHorizonte.temBacktesting ? (
                <p className="mt-1 text-2xl font-bold text-teal-950">
                  {calculadoPorHorizonte.mae}{' '}
                  <span className="text-xs font-normal text-teal-700">
                    admissões/mês ({calculadoPorHorizonte.totalAvaliados}{' '}
                    {calculadoPorHorizonte.totalAvaliados === 1 ? 'mês' : 'meses'})
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm font-semibold text-teal-950">
                  Indisponível{' '}
                  <span className="block text-xs font-normal text-teal-700">
                    Requer ano anterior na série
                  </span>
                </p>
              )}
            </div>
          </div>

          {calculadoPorHorizonte.previsoes.length > 0 && (
            <div className="rounded-lg border border-teal-950/15 bg-white p-4">
              <h3 className="mb-3 text-base font-semibold text-teal-950">
                Projeção de admissões ({horizonteMeses}{' '}
                {horizonteMeses === 1 ? 'próximo mês' : 'próximos meses'})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal-950/15 text-xs uppercase text-teal-800">
                      <th className="py-2 pr-4">Mês previsto</th>
                      <th className="py-2 pr-4">Referência sazonal</th>
                      <th className="py-2 text-right">Admissões estimadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-950/10">
                    {calculadoPorHorizonte.previsoes.map((item) => (
                      <tr key={`${item.ano}-${item.mes}`}>
                        <td className="py-2 pr-4 font-medium text-teal-950">
                          {formatarMesAno(item.mes, item.ano)}
                        </td>
                        <td className="py-2 pr-4 text-teal-700">{item.referencia}</td>
                        <td className="py-2 text-right font-semibold text-teal-950">
                          {item.previsto.toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {calculadoPorHorizonte.temBacktesting ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-teal-950/15 bg-white p-4">
                <h3 className="mb-1 text-base font-semibold text-teal-950">
                  Avaliação temporal (Backtesting — Observado vs. Estimado)
                </h3>
                <p className="mb-3 text-xs text-teal-700">
                  Recorte dos últimos {calculadoPorHorizonte.totalAvaliados}{' '}
                  {calculadoPorHorizonte.totalAvaliados === 1 ? 'mês avaliado' : 'meses avaliados'},
                  previstos com o mesmo mês de 12 meses antes.
                </p>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-teal-950/15 text-xs uppercase text-teal-800">
                        <th className="py-2 pr-4">Período</th>
                        <th className="py-2 pr-4 text-right">Realizado</th>
                        <th className="py-2 pr-4 text-right">Estimado</th>
                        <th className="py-2 text-right">Erro absoluto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-950/10">
                      {calculadoPorHorizonte.comparacoes.map((comp) => (
                        <tr key={`${comp.ano}-${comp.mes}`}>
                          <td className="py-2 pr-4 font-medium text-teal-950">
                            {formatarMesAno(comp.mes, comp.ano)}
                          </td>
                          <td className="py-2 pr-4 text-right text-teal-900">
                            {comp.real.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 pr-4 text-right text-teal-700">
                            {comp.previsto.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 text-right font-medium text-amber-800">
                            {comp.erro_absoluto.toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-teal-950/15 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Período e realizado
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-teal-950">
                    Mês avaliado no teste e total de admissões observado no período.
                  </p>
                </div>
                <div className="rounded-lg border border-teal-950/15 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Estimado
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-teal-950">
                    Projeção pelo mesmo mês do ano anterior (ex.: Jan/2025 estima 5 de Jan/2024).
                  </p>
                </div>
                <div className="rounded-lg border border-teal-950/15 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Erro absoluto
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-teal-950">
                    Diferença sem sinal entre realizado e estimado (|Realizado − Estimado|).
                  </p>
                </div>
                <div className="rounded-lg border border-teal-950/15 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Média (MAE)
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-teal-950">
                    Média dos erros absolutos no horizonte selecionado ({horizonteMeses}{' '}
                    {horizonteMeses === 1 ? 'mês' : 'meses'}).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-teal-950/15 bg-white p-4 text-sm text-teal-800">
              <p className="font-semibold text-teal-950">
                Avaliação temporal (Backtesting) não disponível para o recorte atual
              </p>
              <p className="mt-1 text-xs leading-relaxed text-teal-700">
                {calculadoPorHorizonte.observacaoBacktesting ??
                  'São necessários pelo menos dois anos completos na série observada para comparar realizado e estimado mês a mês.'}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}