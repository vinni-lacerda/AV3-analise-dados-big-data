'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Download, Database, BarChart3, HelpCircle, Eye, X, CheckCircle2, AlertCircle,
  Edit3, Save, RotateCcw, SlidersHorizontal, Code2, ChevronLeft, ChevronRight, ChevronDown,
  ArrowUp, ArrowDown, ArrowUpDown, Menu
} from 'lucide-react';
import {
  ACTS_OFICIAIS, SCHEMA_COLUMNS, MESES_NOMES, MOCK_TOURISM_DATA, INITIAL_QUESTIONS,
  formatCurrency, formatNumber
} from '../data/raisTourism';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ink = teal-950 · lagoon = teal-700 · sun = amber-300 · peak = orange-500 */
/* paper = #EEF3F1                                                      */
/* ------------------------------------------------------------------ */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400..700&display=swap');
.obs{font-family:'Figtree',system-ui,sans-serif;font-variant-numeric:tabular-nums}
.obs .display{font-family:'Bricolage Grotesque','Figtree',sans-serif;letter-spacing:-0.02em}
@keyframes obs-drawer{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
.obs-drawer{animation:obs-drawer .22s ease-out}
@media (prefers-reduced-motion:reduce){.obs-drawer{animation:none}}
`;

const sideInput =
  'w-full rounded-md bg-teal-900/70 border border-teal-800 px-3 py-2 text-sm text-white placeholder:text-teal-400 ' +
  'focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 [&>option]:text-teal-950';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-teal-200">{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-teal-950 pt-3">
      <div>
        <h2 className="display text-xl font-semibold text-teal-950">{title}</h2>
        {hint && <p className="mt-0.5 max-w-xl text-sm text-teal-800/80">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export default function ObservatoryDashboard() {
  // Navegação principal
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'qa'
  const [showFilters, setShowFilters] = useState(false); // só layout (mobile)

  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegiao, setSelectedRegiao] = useState('Todas');
  const [selectedUF, setSelectedUF] = useState('Todas');
  const [selectedACT, setSelectedACT] = useState('Todas');
  const [selectedMes, setSelectedMes] = useState('Todos');
  const [selectedSexo, setSelectedSexo] = useState('Todos');
  const [selectedEscolaridade, setSelectedEscolaridade] = useState('Todas');

  // Estados da Tabela
  const [sortConfig, setSortConfig] = useState({ key: 'Id', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Estados das 6 Perguntas (Persistência em localStorage)
  type QaNote = {
    answer: string;
    query: string;
    status: 'pending' | 'answered';
    updatedAt: string | null;
  };

  const [qaNotes, setQaNotes] = useState<Record<string, QaNote>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('turismo_rais_2025_qa');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
    const init: Record<string, QaNote> = {};
    INITIAL_QUESTIONS.forEach((q: any) => {
      init[q.id] = {
        answer: q.defaultAnswer,
        query: q.defaultQuery,
        status: 'pending',
        updatedAt: null
      };
    });
    return init;
  });

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({
    q1: true, q2: true, q3: false, q4: false, q5: false, q6: false
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('turismo_rais_2025_qa', JSON.stringify(qaNotes));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }, [qaNotes]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Opções dinâmicas para dropdowns
  const filterOptions = useMemo(() => {
    const regioes = ['Todas', ...new Set(MOCK_TOURISM_DATA.map((d: any) => d.Regiao_UF))].sort();
    const ufs = ['Todas', ...new Set(MOCK_TOURISM_DATA.map((d: any) => d.UF))].sort();
    const escolaridades = ['Todas', ...new Set(MOCK_TOURISM_DATA.map((d: any) => d.Escolaridade_Rotulo))];
    return { regioes, ufs, escolaridades };
  }, []);

  // Filtragem de dados
  const filteredData = useMemo(() => {
    return MOCK_TOURISM_DATA.filter((row: any) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        row.Municipio.toLowerCase().includes(q) ||
        row.Regiao_Turistica.toLowerCase().includes(q) ||
        row['CNAE_2.0_Subclasse'].toLowerCase().includes(q) ||
        row['CNAE_2.0_Classe'].toLowerCase().includes(q) ||
        row.ACT.toLowerCase().includes(q);

      const matchesRegiao = selectedRegiao === 'Todas' || row.Regiao_UF === selectedRegiao;
      const matchesUF = selectedUF === 'Todas' || row.UF === selectedUF;
      const matchesACT = selectedACT === 'Todas' || row.ACT === selectedACT;
      const matchesMes = selectedMes === 'Todos' || String(row.Mes_Admissao) === selectedMes;
      const matchesSexo = selectedSexo === 'Todos' || row.Sexo === selectedSexo;
      const matchesEscolaridade =
        selectedEscolaridade === 'Todas' || row.Escolaridade_Rotulo === selectedEscolaridade;

      return (
        matchesSearch && matchesRegiao && matchesUF && matchesACT &&
        matchesMes && matchesSexo && matchesEscolaridade
      );
    });
  }, [searchQuery, selectedRegiao, selectedUF, selectedACT, selectedMes, selectedSexo, selectedEscolaridade]);

  // Ordenação da tabela
  const sortedData = useMemo(() => {
    const sortable = [...filteredData];
    sortable.sort((a: any, b: any) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [filteredData, sortConfig]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRegiao, selectedUF, selectedACT, selectedMes, selectedSexo, selectedEscolaridade]);

  // KPIs dinâmicos
  const kpis = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return { totalVinculos: 0, remuneracaoMedia: 0, horasMedias: 0, municipioDestaque: '—', municipioCount: 0 };
    }
    const sumRem = filteredData.reduce((acc: number, r: any) => acc + r.Remuneracao_Dezembro, 0);
    const sumHoras = filteredData.reduce((acc: number, r: any) => acc + r.Qtd_Horas_Contratadas, 0);

    const cityCounts: Record<string, number> = {};
    filteredData.forEach((r: any) => {
      const label = `${r.Municipio} (${r.UF})`;
      cityCounts[label] = (cityCounts[label] || 0) + 1;
    });
    const topCityEntry = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalVinculos: total,
      remuneracaoMedia: sumRem / total,
      horasMedias: sumHoras / total,
      municipioDestaque: topCityEntry ? topCityEntry[0] : '—',
      municipioCount: topCityEntry ? topCityEntry[1] : 0
    };
  }, [filteredData]);

  // Agregações para os Gráficos
  const chartData = useMemo(() => {
    const actMap: Record<string, { name: string; count: number; avgSalary: number; totalSalary: number }> = {};
    ACTS_OFICIAIS.forEach((act: string) => {
      actMap[act] = { name: act, count: 0, avgSalary: 0, totalSalary: 0 };
    });
    filteredData.forEach((r: any) => {
      if (!actMap[r.ACT]) {
        actMap[r.ACT] = { name: r.ACT, count: 0, avgSalary: 0, totalSalary: 0 };
      }
      actMap[r.ACT].count += 1;
      actMap[r.ACT].totalSalary += r.Remuneracao_Dezembro;
    });
    const actList = Object.values(actMap)
      .map((item) => ({ ...item, avgSalary: item.count > 0 ? item.totalSalary / item.count : 0 }))
      .sort((a, b) => b.count - a.count);

    const monthsList = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const count = filteredData.filter((r: any) => r.Mes_Admissao === m).length;
      return { monthNum: m, shortName: MESES_NOMES[m].slice(0, 3), fullName: MESES_NOMES[m], count };
    });

    return { actList, monthsList };
  }, [filteredData]);

  // Insights dinâmicos pré-calculados para as 6 perguntas (prova de conceito na base mockada)
  const dynamicQuestionPreviews = useMemo(() => {
    const data = MOCK_TOURISM_DATA as any[];

    const cityMap: Record<string, { label: string; count: number; sumSal: number; meses: Record<number, number> }> = {};
    data.forEach((r) => {
      const k = `${r.Municipio} - ${r.UF}`;
      if (!cityMap[k]) cityMap[k] = { label: k, count: 0, sumSal: 0, meses: {} };
      cityMap[k].count += 1;
      cityMap[k].sumSal += r.Remuneracao_Dezembro;
      if (r.Mes_Admissao > 0) {
        cityMap[k].meses[r.Mes_Admissao] = (cityMap[k].meses[r.Mes_Admissao] || 0) + 1;
      }
    });
    const topCitiesByJobs = Object.values(cityMap).sort((a, b) => b.count - a.count).slice(0, 4);

    const monthMap: Record<number, number> = {};
    data.forEach((r) => {
      if (r.Mes_Admissao > 0) monthMap[r.Mes_Admissao] = (monthMap[r.Mes_Admissao] || 0) + 1;
    });
    const topMonths = Object.entries(monthMap)
      .map(([m, c]) => ({ mes: MESES_NOMES[Number(m)], count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const topCitiesByMoney = Object.values(cityMap)
      .map((c) => ({ ...c, avgSal: c.sumSal / c.count }))
      .sort((a, b) => b.avgSal - a.avgSal)
      .slice(0, 4);

    const cnaeMap: Record<string, { subclasse: string; classe: string; act: string; count: number; sumSal: number }> = {};
    data.forEach((r) => {
      const k = r['CNAE_2.0_Subclasse'];
      if (!cnaeMap[k]) {
        cnaeMap[k] = { subclasse: k, classe: r['CNAE_2.0_Classe'], act: r.ACT, count: 0, sumSal: 0 };
      }
      cnaeMap[k].count += 1;
      cnaeMap[k].sumSal += r.Remuneracao_Dezembro;
    });
    const topCnaeBySalary = Object.values(cnaeMap)
      .map((c) => ({ ...c, avgSal: c.sumSal / c.count }))
      .sort((a, b) => b.avgSal - a.avgSal)
      .slice(0, 4);

    const cityMonthPairs: Record<string, { city: string; mes: string; count: number; sumSal: number }> = {};
    data.forEach((r) => {
      if (r.Mes_Admissao > 0) {
        const key = `${r.Municipio} (${r.UF})|${r.Mes_Admissao}`;
        if (!cityMonthPairs[key]) {
          cityMonthPairs[key] = { city: `${r.Municipio} (${r.UF})`, mes: MESES_NOMES[r.Mes_Admissao], count: 0, sumSal: 0 };
        }
        cityMonthPairs[key].count += 1;
        cityMonthPairs[key].sumSal += r.Remuneracao_Dezembro;
      }
    });
    const bestRelocation = Object.values(cityMonthPairs)
      .map((item) => ({ ...item, avgSal: item.sumSal / item.count, score: item.count * (item.sumSal / item.count) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const actTopCnae = ACTS_OFICIAIS.map((act: string) => {
      const filteredAct = Object.values(cnaeMap).filter((c) => c.act === act);
      const top = filteredAct.sort((a, b) => b.count - a.count)[0];
      return {
        act,
        topSubclasse: top ? top.subclasse : 'Sem registros na amostra',
        classe: top ? top.classe : '—',
        count: top ? top.count : 0
      };
    });

    return { q1: topCitiesByJobs, q2: topMonths, q3: topCitiesByMoney, q4: topCnaeBySalary, q5: bestRelocation, q6: actTopCnae };
  }, []);

  // Linhas genéricas para o preview de cada pergunta (mesmos dados, mesma lógica)
  const previewRows = (id: string): { key: string; label: string; sub?: string; value: string; note?: string }[] => {
    const p: any = dynamicQuestionPreviews;
    switch (id) {
      case 'q1': return p.q1.map((i: any) => ({ key: i.label, label: i.label, value: `${i.count} vínculos` }));
      case 'q2': return p.q2.map((i: any) => ({ key: i.mes, label: i.mes, value: `${i.count} admissões` }));
      case 'q3': return p.q3.map((i: any) => ({ key: i.label, label: i.label, sub: `${i.count} reg.`, value: formatCurrency(i.avgSal) }));
      case 'q4': return p.q4.map((i: any) => ({ key: i.subclasse, label: i.subclasse, sub: i.act, value: formatCurrency(i.avgSal) }));
      case 'q5': return p.q5.map((i: any) => ({
        key: `${i.city}-${i.mes}`, label: i.city, sub: `Mês: ${i.mes}`, value: formatCurrency(i.avgSal), note: `${i.count} contratações`
      }));
      case 'q6': return p.q6.map((i: any) => ({
        key: i.act, label: i.act, sub: `Líder: ${i.topSubclasse}`, value: `Classe ${i.classe}`, note: `${i.count} reg.`
      }));
      default: return [];
    }
  };

  // Handlers
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRegiao('Todas');
    setSelectedUF('Todas');
    setSelectedACT('Todas');
    setSelectedMes('Todos');
    setSelectedSexo('Todos');
    setSelectedEscolaridade('Todas');
    triggerToast('Filtros restaurados para visualização completa.');
  };

  const handleExportCSV = () => {
    const headers = SCHEMA_COLUMNS.map((c: any) => c.key);
    const csvRows = [
      headers.join(';'),
      ...sortedData.map((row: any) =>
        headers.map((field: string) => `"${String(row[field]).replace(/"/g, '""')}"`).join(';')
      )
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rais_turismo_2025_filtrado_${sortedData.length}_registros.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exportado CSV com ${sortedData.length} registros filtrados.`);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(sortedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rais_turismo_2025_filtrado_${sortedData.length}_registros.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exportado JSON com ${sortedData.length} registros filtrados.`);
  };

  const startEditingQuestion = (qId: string) => {
    setEditingQuestionId(qId);
    setDraftAnswer(qaNotes[qId]?.answer || '');
    setDraftQuery(qaNotes[qId]?.query || '');
  };

  const saveQuestionNote = (qId: string) => {
    const hasContent = draftAnswer.trim().length > 0;
    setQaNotes((prev) => ({
      ...prev,
      [qId]: {
        answer: draftAnswer,
        query: draftQuery,
        status: hasContent ? 'answered' : 'pending',
        updatedAt: new Date().toLocaleString('pt-BR')
      }
    }));
    setEditingQuestionId(null);
    triggerToast('Resposta oficial atualizada e salva no navegador!');
  };

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestionIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Colunas exibidas na tabela (Modo Compacto vs Todas as 21 Colunas)
  const visibleColumns = useMemo(() => {
    if (showAllColumns) return SCHEMA_COLUMNS;
    const compactKeys = [
      'Id', 'Municipio', 'UF', 'Regiao_Turistica', 'ACT', 'CNAE_2.0_Subclasse',
      'Mes_Admissao', 'Qtd_Horas_Contratadas', 'Remuneracao_Dezembro'
    ];
    return SCHEMA_COLUMNS.filter((col: any) => compactKeys.includes(col.key));
  }, [showAllColumns]);

  const answeredCount = Object.values(qaNotes).filter((n) => n.status === 'answered').length;
  const maxActCount = Math.max(...chartData.actList.map((i) => i.count), 1);
  const maxMonthCount = Math.max(...chartData.monthsList.map((i) => i.count), 1);

  const navBtn = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
      active ? 'bg-amber-300 text-teal-950' : 'text-teal-100 hover:bg-teal-900'
    }`;

  const ghostBtn =
    'inline-flex items-center justify-center gap-2 rounded-md border border-teal-800 px-3 py-2 text-sm font-medium text-teal-50 transition-colors hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300';

  return (
    <div className="obs min-h-screen bg-[#EEF3F1] text-teal-950 lg:flex">
      <style>{FONTS}</style>

      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[60] flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-md bg-amber-300 px-4 py-2.5 text-sm font-medium text-teal-950 shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* BARRA LATERAL: navegação, filtros e exportação                    */}
      {/* ================================================================ */}
      <aside className="bg-teal-950 text-teal-50 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex flex-col gap-6 px-5 py-5 lg:min-h-full lg:py-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="display text-2xl font-bold leading-none text-white">Observatório</div>
              <div className="mt-1 text-sm text-teal-300">Turismo · RAIS 2025</div>
            </div>
            {activeTab === 'explorer' && (
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-teal-800 px-3 py-2 text-sm lg:hidden"
                aria-expanded={showFilters}
              >
                <Menu className="h-4 w-4" />
                Filtros
              </button>
            )}
          </div>

          <nav className="space-y-1" aria-label="Seções">
            <button onClick={() => setActiveTab('explorer')} className={navBtn(activeTab === 'explorer')}>
              <BarChart3 className="h-4 w-4" />
              Explorador de dados
            </button>
            <button onClick={() => setActiveTab('qa')} className={navBtn(activeTab === 'qa')}>
              <HelpCircle className="h-4 w-4" />
              <span className="flex-1">Perguntas de negócio</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === 'qa' ? 'bg-teal-950 text-amber-300' : 'bg-teal-800 text-teal-100'
                }`}
              >
                {answeredCount}/6
              </span>
            </button>
          </nav>

          {/* Filtros */}
          {activeTab === 'explorer' && (
            <section className={`${showFilters ? 'block' : 'hidden'} space-y-3.5 lg:block`}>
              <div className="flex items-center justify-between border-t border-teal-800 pt-4">
                <h2 className="display text-base font-semibold text-white">Filtros</h2>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              </div>

              <Field label="Busca livre (município, região turística ou CNAE)">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Porto Seguro, Hotéis, 5510-8…"
                    className={`${sideInput} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Macrorregião">
                <select value={selectedRegiao} onChange={(e) => setSelectedRegiao(e.target.value)} className={sideInput}>
                  {filterOptions.regioes.map((reg: any) => (
                    <option key={reg} value={reg}>{reg === 'Todas' ? 'Todas as regiões' : reg}</option>
                  ))}
                </select>
              </Field>

              <Field label="Estado (UF)">
                <select value={selectedUF} onChange={(e) => setSelectedUF(e.target.value)} className={sideInput}>
                  {filterOptions.ufs.map((uf: any) => (
                    <option key={uf} value={uf}>{uf === 'Todas' ? 'Todos os estados' : uf}</option>
                  ))}
                </select>
              </Field>

              <Field label="Atividade característica (ACT)">
                <select value={selectedACT} onChange={(e) => setSelectedACT(e.target.value)} className={sideInput}>
                  <option value="Todas">Todas as 8 ACTs</option>
                  {ACTS_OFICIAIS.map((act: string) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </Field>

              <Field label="Mês de admissão">
                <select value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)} className={sideInput}>
                  <option value="Todos">Todos os meses</option>
                  {Object.entries(MESES_NOMES).map(([num, nome]) => (
                    <option key={num} value={num}>
                      {num === '0' ? '0 - Anterior a 2025' : `${num.padStart(2, '0')} - ${nome}`}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Sexo">
                  <select value={selectedSexo} onChange={(e) => setSelectedSexo(e.target.value)} className={sideInput}>
                    <option value="Todos">Todos</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </Field>
                <Field label="Escolaridade">
                  <select
                    value={selectedEscolaridade}
                    onChange={(e) => setSelectedEscolaridade(e.target.value)}
                    className={sideInput}
                  >
                    {filterOptions.escolaridades.map((esc: any) => (
                      <option key={esc} value={esc}>{esc === 'Todas' ? 'Todas' : esc}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>
          )}

          {/* Ações */}
          <div className="mt-auto space-y-2 border-t border-teal-800 pt-4">
            <button onClick={() => setShowSchemaModal(true)} className={`${ghostBtn} w-full`}>
              <Code2 className="h-4 w-4 text-amber-300" />
              Ver schema (21 colunas)
            </button>
            
            <p className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-teal-400">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Dados mockados no schema oficial do Ministério do Turismo (CGDI/MTur).
            </p>
          </div>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* CONTEÚDO PRINCIPAL                                                */}
      {/* ================================================================ */}
      <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Título */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
                Empregos formais no turismo brasileiro
              </h1>
            </div>
          </header>

          {/* KPIs: uma faixa contínua, sem cartões */}
          <section className="grid grid-cols-2 border-y border-teal-950/15 lg:grid-cols-4 lg:divide-x lg:divide-teal-950/15">
            <div className="py-5 pr-5">
              <div className="text-sm text-teal-800">Vínculos ativos</div>
              <div className="display mt-1 text-4xl font-bold">{formatNumber(kpis.totalVinculos)}</div>
              <div className="mt-1 text-xs text-teal-700">
                {Math.round((kpis.totalVinculos / MOCK_TOURISM_DATA.length) * 100)}% da amostra
              </div>
            </div>
            <div className="py-5 pl-5 pr-5 lg:pl-6">
              <div className="text-sm text-teal-800">Remuneração média em dezembro</div>
              <div className="display mt-1 text-4xl font-bold">{formatCurrency(kpis.remuneracaoMedia)}</div>
              <div className="mt-1 text-xs text-teal-700">Valor nominal de dez/2025</div>
            </div>
            <div className="border-t border-teal-950/15 py-5 pr-5 lg:border-t-0 lg:pl-6">
              <div className="text-sm text-teal-800">Carga horária média</div>
              <div className="display mt-1 text-4xl font-bold">
                {kpis.horasMedias.toFixed(1)}
                <span className="ml-1 text-lg font-semibold text-teal-700">h/sem</span>
              </div>
              <div className="mt-1 text-xs text-teal-700">Média de Qtd_Horas_Contratadas</div>
            </div>
            <div className="min-w-0 border-t border-teal-950/15 py-5 pl-5 lg:border-t-0 lg:pl-6">
              <div className="text-sm text-teal-800">Município com mais vínculos</div>
              <div className="display mt-1 truncate text-2xl font-bold leading-[2.5rem]" title={kpis.municipioDestaque}>
                {kpis.municipioDestaque}
              </div>
              <div className="mt-1 text-xs text-teal-700">
                {kpis.municipioCount} {kpis.municipioCount === 1 ? 'vínculo filtrado' : 'vínculos filtrados'}
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* ABA 1: EXPLORADOR                                             */}
          {/* ============================================================ */}
          {activeTab === 'explorer' && (
            <>
              <section className="grid grid-cols-1 gap-x-12 gap-y-10 xl:grid-cols-2">
                {/* Distribuição por ACT */}
                <div className="space-y-5">
                  <SectionTitle
                    title="Vínculos por atividade"
                    hint="Quantidade de vínculos e remuneração média em cada uma das 8 ACTs."
                  />
                  <ul className="space-y-3.5">
                    {chartData.actList.map((item) => {
                      const pct = Math.round((item.count / maxActCount) * 100);
                      return (
                        <li key={item.name}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="shrink-0">
                              <strong>{item.count}</strong>{' '}
                              <span className="text-teal-700">{item.count === 1 ? 'vaga' : 'vagas'}</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full bg-teal-950/10">
                            <div className="h-full bg-teal-700 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 text-xs text-teal-700">
                            Média {formatCurrency(item.avgSalary)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Sazonalidade */}
                <div className="space-y-5">
                  <SectionTitle
                    title="Admissões mês a mês em 2025"
                    hint="Picos de contratação na alta temporada. Vínculos antigos ficam de fora."
                  />
                  <div className="flex h-56 items-end gap-1.5 border-b-2 border-teal-950 pt-6 sm:gap-2">
                    {chartData.monthsList.map((m) => {
                      const heightPct = m.count > 0 ? Math.max(14, Math.round((m.count / maxMonthCount) * 100)) : 3;
                      const isPeak = m.count === maxMonthCount && m.count > 0;
                      return (
                        <div
                          key={m.monthNum}
                          className="flex h-full flex-1 flex-col items-center justify-end"
                          title={`${m.fullName}: ${m.count} admissões`}
                        >
                          <span className={`mb-1 text-xs font-semibold ${m.count > 0 ? 'text-teal-950' : 'text-teal-950/30'}`}>
                            {m.count}
                          </span>
                          <div
                            className={`w-full transition-[height] duration-500 ${
                              m.count === 0 ? 'bg-teal-950/10' : isPeak ? 'bg-orange-500' : 'bg-teal-700'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    {chartData.monthsList.map((m) => (
                      <div key={m.monthNum} className="flex-1 text-center text-xs text-teal-800">{m.shortName}</div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-teal-800">
                    <span>Mes_Admissao = 0 indica estoque anterior a 2025.</span>
                    <span className="font-semibold text-teal-950">
                      Admissões em 2025: {filteredData.filter((r: any) => r.Mes_Admissao > 0).length}
                    </span>
                  </div>
                </div>
              </section>

              {/* Tabela */}
              <section className="space-y-4">
                <SectionTitle
                  title="Registros de vínculos formais"
                  hint="Clique no cabeçalho para ordenar ou no ícone de olho para ver os 21 atributos do registro."
                  right={
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowAllColumns((prev) => !prev)}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          showAllColumns
                            ? 'border-teal-950 bg-teal-950 text-white'
                            : 'border-teal-950/25 bg-white hover:border-teal-950'
                        }`}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        {showAllColumns ? 'Modo compacto (9 colunas)' : 'Ver todas as 21 colunas'}
                      </button>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-md border border-teal-950/25 bg-white px-2.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-700"
                      >
                        <option value={10}>10 por página</option>
                        <option value={20}>20 por página</option>
                        <option value={50}>50 por página</option>
                      </select>
                    </div>
                  }
                />

                <div className="overflow-x-auto rounded-md border border-teal-950/15 bg-white">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-teal-950 bg-white text-xs font-semibold text-teal-800">
                        <th className="sticky left-0 z-10 w-12 bg-white px-3 py-3">
                          <span className="sr-only">Inspecionar</span>
                        </th>
                        {visibleColumns.map((col: any) => {
                          const active = sortConfig.key === col.key;
                          const Icon = !active ? ArrowUpDown : sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
                          return (
                            <th
                              key={col.key}
                              onClick={() => handleSort(col.key)}
                              aria-sort={active ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                              className="cursor-pointer select-none whitespace-nowrap px-4 py-3 transition-colors hover:text-teal-950"
                            >
                              <span className={`inline-flex items-center gap-1.5 ${active ? 'text-teal-950' : ''}`}>
                                {col.label}
                                <Icon className={`h-3 w-3 ${active ? 'text-orange-600' : 'text-teal-400'}`} />
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-950/10">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.length + 1} className="py-14 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <AlertCircle className="h-7 w-7 text-teal-700" />
                              <p className="font-medium">Nenhum vínculo encontrado para os filtros aplicados.</p>
                              <button
                                onClick={resetFilters}
                                className="text-sm font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-950"
                              >
                                Limpar filtros
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((row: any) => (
                          <tr key={row.Id} className="group transition-colors hover:bg-amber-50">
                            <td className="sticky left-0 z-10 bg-white px-3 py-2.5 group-hover:bg-amber-50">
                              <button
                                onClick={() => setSelectedRow(row)}
                                className="grid h-8 w-8 place-items-center rounded-full border border-teal-950/20 text-teal-800 transition-colors hover:border-teal-950 hover:bg-teal-950 hover:text-white"
                                title="Ver todos os 21 campos"
                                aria-label={`Ver detalhes do registro ${row.Id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>

                            {visibleColumns.map((col: any) => {
                              const val = row[col.key];
                              if (col.key === 'Remuneracao_Dezembro') {
                                return (
                                  <td key={col.key} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                                    {formatCurrency(val)}
                                  </td>
                                );
                              }
                              if (col.key === 'ACT') {
                                return (
                                  <td key={col.key} className="whitespace-nowrap px-4 py-2.5">
                                    <span className="inline-flex items-center gap-2 font-medium text-teal-800">
                                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                                      {val}
                                    </span>
                                  </td>
                                );
                              }
                              if (col.key === 'Mes_Admissao') {
                                return (
                                  <td key={col.key} className="whitespace-nowrap px-4 py-2.5">
                                    {val === 0 ? (
                                      <span className="text-teal-600">0 (Anterior)</span>
                                    ) : (
                                      <span>{String(val).padStart(2, '0')} - {MESES_NOMES[val]}</span>
                                    )}
                                  </td>
                                );
                              }
                              if (col.key === 'CNAE_2.0_Subclasse') {
                                return (
                                  <td key={col.key} className="max-w-xs truncate px-4 py-2.5 text-teal-800" title={val}>
                                    {val}
                                  </td>
                                );
                              }
                              return (
                                <td key={col.key} className="whitespace-nowrap px-4 py-2.5">{val}</td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                <div className="flex flex-col gap-3 text-sm text-teal-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Mostrando{' '}
                    <strong className="text-teal-950">{sortedData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</strong>{' '}
                    a <strong className="text-teal-950">{Math.min(currentPage * rowsPerPage, sortedData.length)}</strong>{' '}
                    de <strong className="text-teal-950">{sortedData.length}</strong> registros
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-950/25 bg-white px-3 py-1.5 transition-colors hover:border-teal-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <span className="px-2 font-semibold text-teal-950">Página {currentPage} de {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 rounded-md border border-teal-950/25 bg-white px-3 py-1.5 transition-colors hover:border-teal-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ============================================================ */}
          {/* ABA 2: PERGUNTAS DE NEGÓCIO                                   */}
          {/* ============================================================ */}
          {activeTab === 'qa' && (
            <section className="space-y-6">
              <SectionTitle
                title="6 perguntas estratégicas sobre empregos no turismo"
                hint="Cada pergunta mostra uma prévia calculada na amostra mockada e um espaço para registrar a query e o resultado oficial após processar a base completa."
                right={
                  <div className="min-w-[10rem]">
                    <div className="text-sm text-teal-800">
                      <strong className="text-teal-950">{answeredCount}</strong> de 6 respondidas
                    </div>
                    <div className="mt-1.5 grid grid-cols-6 gap-1">
                      {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className={`h-1.5 ${i < answeredCount ? 'bg-teal-700' : 'bg-teal-950/15'}`} />
                      ))}
                    </div>
                  </div>
                }
              />

              <div className="divide-y divide-teal-950/15 border-b border-teal-950/15">
                {INITIAL_QUESTIONS.map((q: any) => {
                  const note = qaNotes[q.id] || { answer: '', query: q.defaultQuery, status: 'pending', updatedAt: null };
                  const isExpanded = !!expandedQuestionIds[q.id];
                  const isEditing = editingQuestionId === q.id;
                  const isAnswered = note.status === 'answered';

                  return (
                    <article key={q.id}>
                      <button
                        onClick={() => toggleQuestionExpand(q.id)}
                        aria-expanded={isExpanded}
                        className="flex w-full items-start gap-4 py-5 text-left transition-colors hover:bg-white/60 sm:items-center sm:gap-6"
                      >
                        <span className="display w-10 shrink-0 text-4xl font-bold leading-none text-teal-700">{q.number}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="font-semibold text-teal-700">{q.tag}</span>
                            {isAnswered ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-teal-800">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Respondida com a base oficial
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-medium text-orange-700">
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                                Aguardando base completa
                              </span>
                            )}
                          </span>
                          <span className="display mt-1 block text-lg font-semibold leading-snug sm:text-xl">{q.title}</span>
                        </span>
                        <ChevronDown
                          className={`mt-1 h-5 w-5 shrink-0 text-teal-700 transition-transform sm:mt-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="space-y-6 pb-8 pl-0 sm:pl-16">
                          <p className="max-w-3xl border-l-2 border-amber-400 pl-3 text-sm leading-relaxed text-teal-900">
                            <strong>Abordagem de engenharia de dados:</strong> {q.methodology}
                          </p>

                          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Preview dinâmico */}
                            <div>
                              <h4 className="display text-base font-semibold">Prévia na amostra mockada</h4>
                              <p className="text-xs text-teal-700">Calculada em tempo real.</p>
                              <ol className="mt-3 divide-y divide-teal-950/10 border-y border-teal-950/10">
                                {previewRows(q.id).map((r, idx) => (
                                  <li key={r.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                                    <div className="flex min-w-0 items-baseline gap-3">
                                      <span className="display w-6 shrink-0 font-bold text-orange-600">{idx + 1}</span>
                                      <div className="min-w-0">
                                        <div className="truncate font-medium" title={r.label}>{r.label}</div>
                                        {r.sub && <div className="truncate text-xs text-teal-700" title={r.sub}>{r.sub}</div>}
                                      </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <div className="font-semibold">{r.value}</div>
                                      {r.note && <div className="text-xs text-teal-700">{r.note}</div>}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                              <p className="mt-2 text-xs text-teal-700">Resultados preliminares dos 40 registros mockados.</p>
                            </div>

                            {/* Resposta oficial */}
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="display text-base font-semibold">Resposta oficial (dataset 2025)</h4>
                                  <p className="text-xs text-teal-700">Salva neste navegador.</p>
                                </div>
                                {!isEditing && (
                                  <button
                                    onClick={() => startEditingQuestion(q.id)}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-teal-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    {isAnswered ? 'Editar resposta' : 'Inserir resposta'}
                                  </button>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="mt-3 space-y-3">
                                  <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-teal-800">
                                      Conclusão e insights obtidos da base completa
                                    </span>
                                    <textarea
                                      rows={4}
                                      value={draftAnswer}
                                      onChange={(e) => setDraftAnswer(e.target.value)}
                                      placeholder="Cole os resultados finais, rankings e conclusões após processar a base real do MTur 2025…"
                                      className="w-full rounded-md border border-teal-950/25 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-teal-800">
                                      Query SQL ou script Python (Pandas/PySpark) utilizado
                                    </span>
                                    <textarea
                                      rows={4}
                                      value={draftQuery}
                                      onChange={(e) => setDraftQuery(e.target.value)}
                                      className="w-full rounded-md bg-teal-950 p-3 font-mono text-xs text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    />
                                  </label>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingQuestionId(null)}
                                      className="rounded-md px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-950/10"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => saveQuestionNote(q.id)}
                                      className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                                    >
                                      <Save className="h-4 w-4" />
                                      Salvar resultado
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 space-y-4">
                                  {isAnswered ? (
                                    <div className="whitespace-pre-line rounded-md border-l-4 border-teal-700 bg-white p-4 text-sm leading-relaxed">
                                      {note.answer}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditingQuestion(q.id)}
                                      className="w-full rounded-md border-2 border-dashed border-teal-950/25 p-5 text-center transition-colors hover:border-orange-500 hover:bg-white"
                                    >
                                      <span className="block text-sm font-medium">Espaço reservado para os achados oficiais da base RAIS 2025.</span>
                                      <span className="mt-1 block text-sm font-semibold text-orange-700">
                                        Registrar resposta e código da análise
                                      </span>
                                    </button>
                                  )}

                                  <div>
                                    <div className="mb-1 text-xs font-medium text-teal-800">Query analítica de referência</div>
                                    <pre className="overflow-x-auto rounded-md bg-teal-950 p-3 font-mono text-xs leading-relaxed text-amber-200">
                                      {note.query}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {note.updatedAt && (
                                <p className="mt-3 text-right text-xs text-teal-700">Última atualização: {note.updatedAt}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ================================================================ */}
      {/* PAINEL LATERAL: inspeção de um registro (21 campos)               */}
      {/* ================================================================ */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex justify-end bg-teal-950/50" onClick={() => setSelectedRow(null)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="obs-drawer flex h-full w-full max-w-md flex-col bg-[#F8FAF9] shadow-2xl"
            role="dialog"
            aria-label="Inspeção do registro"
          >
            <div className="flex items-start justify-between gap-4 bg-teal-950 px-6 py-5 text-white">
              <div>
                <div className="text-sm text-amber-300">Registro #{selectedRow.Id}</div>
                <h3 className="display mt-0.5 text-xl font-semibold leading-snug">
                  {selectedRow.Municipio} ({selectedRow.UF})
                </h3>
                <div className="text-sm text-teal-200">{selectedRow.ACT}</div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="rounded-md p-1.5 text-teal-200 transition-colors hover:bg-teal-900 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="flex-1 divide-y divide-teal-950/10 overflow-y-auto px-6">
              {SCHEMA_COLUMNS.map((col: any) => {
                let displayValue = selectedRow[col.key];
                if (col.key === 'Remuneracao_Dezembro') {
                  displayValue = formatCurrency(displayValue);
                } else if (col.key === 'Mes_Admissao') {
                  displayValue = `${displayValue} (${MESES_NOMES[displayValue]})`;
                } else if (col.key === 'Qtd_Horas_Contratadas') {
                  displayValue = `${displayValue} horas/semana`;
                } else if (col.key === 'Tempo_Emprego') {
                  displayValue = `${displayValue} meses`;
                }
                return (
                  <div key={col.key} className="grid grid-cols-5 gap-3 py-3">
                    <dt className="col-span-2">
                      <div className="break-words text-sm font-medium text-teal-800">{col.label}</div>
                      <div className="text-xs text-teal-600">{col.category}</div>
                    </dt>
                    <dd className="col-span-3 break-words text-sm font-semibold">{displayValue}</dd>
                  </div>
                );
              })}
            </dl>

            <div className="border-t border-teal-950/10 px-6 py-3.5">
              <button
                onClick={() => setSelectedRow(null)}
                className="w-full rounded-md bg-teal-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Fechar inspeção
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ================================================================ */}
      {/* PAINEL LATERAL: dicionário de dados (21 colunas)                   */}
      {/* ================================================================ */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-teal-950/50" onClick={() => setShowSchemaModal(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="obs-drawer flex h-full w-full max-w-3xl flex-col bg-[#F8FAF9] shadow-2xl"
            role="dialog"
            aria-label="Dicionário de dados"
          >
            <div className="flex items-start justify-between gap-4 bg-teal-950 px-6 py-5 text-white">
              <div>
                <div className="text-sm text-amber-300">Dicionário de dados</div>
                <h3 className="display mt-0.5 text-xl font-semibold leading-snug">
                  Schema oficial: empregos formais no turismo (RAIS / MTur 2025)
                </h3>
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="rounded-md p-1.5 text-teal-200 transition-colors hover:bg-teal-900 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="mb-4 max-w-2xl text-sm text-teal-800">
                As <strong>21 colunas</strong> do portal de Dados Abertos do Ministério do Turismo: vínculos CLT e
                estatutários ativos em 31/12 nas 8 Atividades Características do Turismo.
              </p>
              <div className="overflow-x-auto rounded-md border border-teal-950/15 bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-teal-950 text-xs font-semibold text-teal-800">
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Coluna</th>
                      <th className="px-3 py-2.5">Tipo SQL</th>
                      <th className="px-3 py-2.5">Dimensão</th>
                      <th className="px-3 py-2.5">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-950/10">
                    {SCHEMA_COLUMNS.map((col: any, idx: number) => (
                      <tr key={col.key} className="align-top hover:bg-amber-50">
                        <td className="px-3 py-2.5 text-teal-600">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-semibold text-teal-800">{col.key}</td>
                        <td className="px-3 py-2.5 text-teal-700">{col.type}</td>
                        <td className="px-3 py-2.5">{col.category}</td>
                        <td className="px-3 py-2.5 text-teal-800">{col.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-teal-950/10 px-6 py-3.5">
              <span className="text-xs text-teal-700">Fonte: dados.turismo.gov.br (RAIS 2025)</span>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="rounded-md bg-teal-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Entendi
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}