'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, Database, BarChart3, HelpCircle, Users, DollarSign, Clock, MapPin, ChevronDown, ChevronUp, ArrowUpDown, Eye, X, CheckCircle2, AlertCircle, Edit3, Save, RotateCcw, Layers, Calendar, Briefcase, SlidersHorizontal, Info, Code2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ACTS_OFICIAIS, SCHEMA_COLUMNS, MESES_NOMES, MOCK_TOURISM_DATA, INITIAL_QUESTIONS, formatCurrency, formatNumber } from '../data/raisTourism';

export default function ObservatoryDashboard() {
  // Navegação principal
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'qa'

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
  const [selectedRow, setSelectedRow] = useState(null);
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
    INITIAL_QUESTIONS.forEach((q) => {
      init[q.id] = {
        answer: q.defaultAnswer,
        query: q.defaultQuery,
        status: 'pending', // 'pending' | 'answered'
        updatedAt: null
      };
    });
    return init;
  });

  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState({
    q1: true,
    q2: true,
    q3: false,
    q4: false,
    q5: false,
    q6: false
  });
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('turismo_rais_2025_qa', JSON.stringify(qaNotes));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }, [qaNotes]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Opções dinâmicas para dropdowns
  const filterOptions = useMemo(() => {
    const regioes = ['Todas', ...new Set(MOCK_TOURISM_DATA.map((d) => d.Regiao_UF))].sort();
    const ufs = ['Todas', ...new Set(MOCK_TOURISM_DATA.map((d) => d.UF))].sort();
    const escolaridades = ['Todas', ...new Set(MOCK_TOURISM_DATA.map((d) => d.Escolaridade_Rotulo))];
    return { regioes, ufs, escolaridades };
  }, []);

  // Filtragem de dados
  const filteredData = useMemo(() => {
    return MOCK_TOURISM_DATA.filter((row) => {
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
        matchesSearch &&
        matchesRegiao &&
        matchesUF &&
        matchesACT &&
        matchesMes &&
        matchesSexo &&
        matchesEscolaridade
      );
    });
  }, [
    searchQuery,
    selectedRegiao,
    selectedUF,
    selectedACT,
    selectedMes,
    selectedSexo,
    selectedEscolaridade
  ]);

  // Ordenação da tabela
  const sortedData = useMemo(() => {
    const sortable = [...filteredData];
    sortable.sort((a, b) => {
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
      return {
        totalVinculos: 0,
        remuneracaoMedia: 0,
        horasMedias: 0,
        municipioDestaque: '—',
        municipioCount: 0
      };
    }

    const sumRem = filteredData.reduce((acc, r) => acc + r.Remuneracao_Dezembro, 0);
    const sumHoras = filteredData.reduce((acc, r) => acc + r.Qtd_Horas_Contratadas, 0);

    const cityCounts: Record<string, number> = {};
    filteredData.forEach((r) => {
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
    // 1. Distribuição por ACT
    const actMap: Record<string, { name: string; count: number; avgSalary: number; totalSalary: number }> = {};
    ACTS_OFICIAIS.forEach((act) => {
      actMap[act] = { name: act, count: 0, avgSalary: 0, totalSalary: 0 };
    });
    filteredData.forEach((r) => {
      if (!actMap[r.ACT]) {
        actMap[r.ACT] = { name: r.ACT, count: 0, avgSalary: 0, totalSalary: 0 };
      }
      actMap[r.ACT].count += 1;
      actMap[r.ACT].totalSalary += r.Remuneracao_Dezembro;
    });
    const actList = Object.values(actMap)
      .map((item) => ({
        ...item,
        avgSalary: item.count > 0 ? item.totalSalary / item.count : 0
      }))
      .sort((a, b) => b.count - a.count);

    // 2. Contratações por Mês de Admissão (1 a 12)
    const monthsList = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const count = filteredData.filter((r) => r.Mes_Admissao === m).length;
      return {
        monthNum: m,
        shortName: MESES_NOMES[m].slice(0, 3),
        fullName: MESES_NOMES[m],
        count
      };
    });

    return { actList, monthsList };
  }, [filteredData]);

  // Insights Dinâmicos Pré-Calculados para as 6 Perguntas (Prova de Conceito na Base Mockada)
  const dynamicQuestionPreviews = useMemo(() => {
    const data = MOCK_TOURISM_DATA;

    // Q1: Cidades com mais empregos
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
    const topCitiesByJobs = Object.values(cityMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Q2: Meses com mais contratações
    const monthMap: Record<number, number> = {};
    data.forEach((r) => {
      if (r.Mes_Admissao > 0) {
        monthMap[r.Mes_Admissao] = (monthMap[r.Mes_Admissao] || 0) + 1;
      }
    });
    const topMonths = Object.entries(monthMap)
      .map(([m, c]) => ({ mes: MESES_NOMES[Number(m)], count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Q3: Cidade que dá mais dinheiro (remuneração média)
    const topCitiesByMoney = Object.values(cityMap)
      .map((c) => ({ ...c, avgSal: c.sumSal / c.count }))
      .sort((a, b) => b.avgSal - a.avgSal)
      .slice(0, 4);

    // Q4: CNAE com mais remuneração
    const cnaeMap: Record<string, { subclasse: string; classe: string; act: string; count: number; sumSal: number }> = {};
    data.forEach((r) => {
      const k = r['CNAE_2.0_Subclasse'];
      if (!cnaeMap[k]) {
        cnaeMap[k] = {
          subclasse: k,
          classe: r['CNAE_2.0_Classe'],
          act: r.ACT,
          count: 0,
          sumSal: 0
        };
      }
      cnaeMap[k].count += 1;
      cnaeMap[k].sumSal += r.Remuneracao_Dezembro;
    });
    const topCnaeBySalary = Object.values(cnaeMap)
      .map((c) => ({ ...c, avgSal: c.sumSal / c.count }))
      .sort((a, b) => b.avgSal - a.avgSal)
      .slice(0, 4);

    // Q5: Cidades que valem a pena se mudar em algum mês (Pico sazonal + Salário competitivo)
    const cityMonthPairs: Record<string, { city: string; mes: string; count: number; sumSal: number }> = {};
    data.forEach((r) => {
      if (r.Mes_Admissao > 0) {
        const key = `${r.Municipio} (${r.UF})|${r.Mes_Admissao}`;
        if (!cityMonthPairs[key]) {
          cityMonthPairs[key] = {
            city: `${r.Municipio} (${r.UF})`,
            mes: MESES_NOMES[r.Mes_Admissao],
            count: 0,
            sumSal: 0
          };
        }
        cityMonthPairs[key].count += 1;
        cityMonthPairs[key].sumSal += r.Remuneracao_Dezembro;
      }
    });
    const bestRelocation = Object.values(cityMonthPairs)
      .map((item) => ({
        ...item,
        avgSal: item.sumSal / item.count,
        score: item.count * (item.sumSal / item.count)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    // Q6: CNAE com mais emprego a partir de cada CNAE / ACT
    const actTopCnae = ACTS_OFICIAIS.map((act) => {
      const filteredAct = Object.values(cnaeMap).filter((c) => c.act === act);
      const top = filteredAct.sort((a, b) => b.count - a.count)[0];
      return {
        act,
        topSubclasse: top ? top.subclasse : 'Sem registros na amostra',
        classe: top ? top.classe : '—',
        count: top ? top.count : 0
      };
    });

    return {
      q1: topCitiesByJobs,
      q2: topMonths,
      q3: topCitiesByMoney,
      q4: topCnaeBySalary,
      q5: bestRelocation,
      q6: actTopCnae
    };
  }, []);

  // Handlers
  const handleSort = (key) => {
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
    const headers = SCHEMA_COLUMNS.map((c) => c.key);
    const csvRows = [
      headers.join(';'),
      ...sortedData.map((row) =>
        headers
          .map((field) => {
            const val = row[field];
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(';')
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

  const startEditingQuestion = (qId) => {
    setEditingQuestionId(qId);
    setDraftAnswer(qaNotes[qId]?.answer || '');
    setDraftQuery(qaNotes[qId]?.query || '');
  };

  const saveQuestionNote = (qId) => {
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

  const toggleQuestionExpand = (qId) => {
    setExpandedQuestionIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Colunas exibidas na tabela (Modo Compacto vs Todas as 21 Colunas)
  const visibleColumns = useMemo(() => {
    if (showAllColumns) return SCHEMA_COLUMNS;
    const compactKeys = [
      'Id',
      'Municipio',
      'UF',
      'Regiao_Turistica',
      'ACT',
      'CNAE_2.0_Subclasse',
      'Mes_Admissao',
      'Qtd_Horas_Contratadas',
      'Remuneracao_Dezembro'
    ];
    return SCHEMA_COLUMNS.filter((col) => compactKeys.includes(col.key));
  }, [showAllColumns]);

  const answeredCount = Object.values(qaNotes).filter((n) => n.status === 'answered').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-cyan-100 selection:text-cyan-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CABEÇALHO & CONTEXTO DA BASE                                         */}
      {/* ==================================================================== */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Database className="w-3.5 h-3.5" />
                  Dados Mockados (Schema Oficial MTur 2025)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Análise de Dados & Big Data
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Observatório de Empregos Formais no Turismo — RAIS 2025
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl">
                Ambiente exploratório estruturado conforme a base aberta do{' '}
                <span className="text-cyan-300 font-medium">Ministério do Turismo (CGDI/MTur)</span> —
                contemplando as 8 Atividades Características do Turismo (ACTs) e 21 atributos do vínculo.
              </p>
            </div>

            {/* Ações Rápidas do Cabeçalho */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowSchemaModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                Ver Schema (21 Colunas)
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title="Baixar dados filtrados em CSV"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer"
                title="Baixar dados filtrados em JSON"
              >
                <Download className="w-4 h-4" />
                Exportar JSON
              </button>
            </div>
          </div>

          {/* Navegação por Abas */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
            <nav className="flex space-x-2" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('explorer')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Explorador de Dados & Visualização
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'qa'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Perguntas de Negócio & Insights (Big Data Q&A)
                <span
                  className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === 'qa'
                      ? 'bg-slate-900 text-cyan-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {answeredCount}/6
                </span>
              </button>
            </nav>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Exibindo <strong className="text-white">{filteredData.length}</strong> de{' '}
                <strong className="text-white">{MOCK_TOURISM_DATA.length}</strong> registros da amostra
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CONTEÚDO PRINCIPAL                                                   */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* CARDS DE KPIs DINÂMICOS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vínculos Ativos (Filtro)
              </span>
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatNumber(kpis.totalVinculos)}
              </span>
              <span className="text-xs text-slate-500">
                ({Math.round((kpis.totalVinculos / MOCK_TOURISM_DATA.length) * 100)}% da amostra)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Empregos formais ativos em 31/12</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Remuneração Média (Dez)
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatCurrency(kpis.remuneracaoMedia)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Média nominal de Dezembro/2025</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Carga Horária Média
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {kpis.horasMedias.toFixed(1)}h
              </span>
              <span className="text-xs text-slate-500">/ semana</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Média de Qtd_Horas_Contratadas</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Município Destaque
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 truncate">
              <span className="text-xl sm:text-2xl font-bold text-slate-900" title={kpis.municipioDestaque}>
                {kpis.municipioDestaque}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {kpis.municipioCount} {kpis.municipioCount === 1 ? 'vínculo filtrado' : 'vínculos filtrados'}
            </p>
          </div>
        </section>

        {/* ================================================================== */}
        {/* ABA 1: EXPLORADOR DE DADOS & VISUALIZAÇÃO                          */}
        {/* ================================================================== */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            {/* BARRA DE FILTROS INTERATIVOS */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Filtros Exploratórios da Base
                  </h2>
                </div>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-cyan-700 bg-slate-100 hover:bg-cyan-50 px-3 py-1.5 rounded-lg transition cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar Filtros
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Busca Textual Livre */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Busca Livre (Município, Região Turística ou CNAE)
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: Porto Seguro, Hotéis, 5510-8, Hortênsias..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Filtro Região */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Macrorregião (Regiao_UF)
                  </label>
                  <select
                    value={selectedRegiao}
                    onChange={(e) => setSelectedRegiao(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  >
                    {filterOptions.regioes.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg === 'Todas' ? 'Todas as Regiões' : reg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro UF */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Estado (UF)
                  </label>
                  <select
                    value={selectedUF}
                    onChange={(e) => setSelectedUF(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  >
                    {filterOptions.ufs.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf === 'Todas' ? 'Todos os Estados' : uf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro ACT (8 Oficiais) */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Atividade Característica (ACT)
                  </label>
                  <select
                    value={selectedACT}
                    onChange={(e) => setSelectedACT(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  >
                    <option value="Todas">Todas as 8 ACTs</option>
                    {ACTS_OFICIAIS.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Mês de Admissão */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Mês de Admissão (Mes_Admissao)
                  </label>
                  <select
                    value={selectedMes}
                    onChange={(e) => setSelectedMes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  >
                    <option value="Todos">Todos os Meses</option>
                    {Object.entries(MESES_NOMES).map(([num, nome]) => (
                      <option key={num} value={num}>
                        {num === '0' ? '0 - Anterior a 2025' : `${num.padStart(2, '0')} - ${nome}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Sexo */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Sexo (Demografia)
                  </label>
                  <select
                    value={selectedSexo}
                    onChange={(e) => setSelectedSexo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>

                {/* Filtro Escolaridade */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Escolaridade (Escolaridade_Rotulo)
                  </label>
                  <select
                    value={selectedEscolaridade}
                    onChange={(e) => setSelectedEscolaridade(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  >
                    {filterOptions.escolaridades.map((esc) => (
                      <option key={esc} value={esc}>
                        {esc === 'Todas' ? 'Todas as Escolaridades' : esc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* GRÁFICOS VISUAIS RÁPIDOS (DISTRIBUIÇÃO POR ACT & SAZONALIDADE MENSAL) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Distribuição por ACT */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-600" />
                      Distribuição por ACT (8 Atividades Oficiais)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quantidade de vínculos e remuneração média por setor turístico
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {chartData.actList.map((item) => {
                    const maxCount = Math.max(...chartData.actList.map((i) => i.count), 1);
                    const pct = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">
                              Média: <strong className="text-slate-700">{formatCurrency(item.avgSalary)}</strong>
                            </span>
                            <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                              {item.count} {item.count === 1 ? 'vaga' : 'vagas'}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-600 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 2: Contratações por Mês de Admissão */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Sazonalidade: Admissões por Mês (2025)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Picos de contratação nos meses de alta temporada (exclui vínculos antigos)
                      </p>
                    </div>
                  </div>

                  {/* Barras Verticais Responsivas */}
                  <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-100">
                    {chartData.monthsList.map((m) => {
                      const maxMonthCount = Math.max(...chartData.monthsList.map((i) => i.count), 1);
                      const heightPct = m.count > 0 ? Math.max(14, Math.round((m.count / maxMonthCount) * 100)) : 4;
                      const isPeak = m.count === maxMonthCount && m.count > 0;

                      return (
                        <div
                          key={m.monthNum}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                          title={`${m.fullName}: ${m.count} admissões`}
                        >
                          <span
                            className={`text-[11px] font-bold mb-1 transition ${
                              m.count > 0 ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          >
                            {m.count}
                          </span>
                          <div
                            className={`w-full max-w-[32px] rounded-t-md transition-all duration-500 ${
                              m.count === 0
                                ? 'bg-slate-100'
                                : isPeak
                                ? 'bg-gradient-to-t from-emerald-600 to-cyan-400 shadow-sm'
                                : 'bg-slate-700 group-hover:bg-cyan-600'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Rótulos dos Meses */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2 px-1">
                    {chartData.monthsList.map((m) => (
                      <div key={m.monthNum} className="flex-1 text-center text-[11px] font-medium text-slate-500">
                        {m.shortName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Nota: Vínculos com Mes_Admissao = 0 representam estoque anterior a 2025.</span>
                  <span className="font-medium text-emerald-700">
                    Admissões 2025: {filteredData.filter((r) => r.Mes_Admissao > 0).length}
                  </span>
                </div>
              </div>
            </section>

            {/* TABELA INTERATIVA COMPLETA */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Barra Superior da Tabela */}
              <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registros de Vínculos Formais (RAIS 2025)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clique nos cabeçalhos para ordenar ou no ícone de olho para inspecionar todos os 21 atributos do registro.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowAllColumns((prev) => !prev)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      showAllColumns
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {showAllColumns ? 'Modo Compacto (9 Colunas)' : 'Ver Todas as 21 Colunas'}
                  </button>

                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                  </select>
                </div>
              </div>

              {/* Container com Scroll Horizontal Suave */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4 sticky left-0 bg-slate-50 z-10">Inspecionar</th>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 hover:text-cyan-700 transition select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col.label}</span>
                            <ArrowUpDown
                              className={`w-3 h-3 ${
                                sortConfig.key === col.key ? 'text-cyan-600' : 'text-slate-400'
                              }`}
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleColumns.length + 1}
                          className="py-12 text-center text-slate-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-400" />
                            <p className="font-medium text-slate-700">
                              Nenhum vínculo encontrado para os filtros aplicados.
                            </p>
                            <button
                              onClick={resetFilters}
                              className="mt-1 text-xs font-semibold text-cyan-600 hover:underline cursor-pointer"
                            >
                              Limpar filtros ativos
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row) => (
                        <tr
                          key={row.Id}
                          className="hover:bg-cyan-50/40 transition-colors group"
                        >
                          <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-cyan-50/40 z-10 border-r border-slate-100">
                            <button
                              onClick={() => setSelectedRow(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-cyan-600 text-slate-700 hover:text-white transition cursor-pointer"
                              title="Ver todos os 21 campos"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detalhes</span>
                            </button>
                          </td>

                          {visibleColumns.map((col) => {
                            const val = row[col.key];
                            if (col.key === 'Remuneracao_Dezembro') {
                              return (
                                <td
                                  key={col.key}
                                  className="py-3 px-4 whitespace-nowrap font-semibold text-emerald-700"
                                >
                                  {formatCurrency(val)}
                                </td>
                              );
                            }
                            if (col.key === 'ACT') {
                              return (
                                <td key={col.key} className="py-3 px-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-200/70">
                                    {val}
                                  </span>
                                </td>
                              );
                            }
                            if (col.key === 'Mes_Admissao') {
                              return (
                                <td key={col.key} className="py-3 px-4 whitespace-nowrap text-slate-600">
                                  {val === 0 ? (
                                    <span className="text-xs text-slate-400">0 (Anterior)</span>
                                  ) : (
                                    <span className="text-xs font-medium text-slate-700">
                                      {String(val).padStart(2, '0')} - {MESES_NOMES[val]}
                                    </span>
                                  )}
                                </td>
                              );
                            }
                            if (col.key === 'CNAE_2.0_Subclasse') {
                              return (
                                <td
                                  key={col.key}
                                  className="py-3 px-4 max-w-xs truncate text-xs text-slate-600"
                                  title={val}
                                >
                                  {val}
                                </td>
                              );
                            }
                            return (
                              <td key={col.key} className="py-3 px-4 whitespace-nowrap text-slate-700">
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé da Tabela com Paginação */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Mostrando{' '}
                  <strong className="text-slate-900">
                    {sortedData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="text-slate-900">
                    {Math.min(currentPage * rowsPerPage, sortedData.length)}
                  </strong>{' '}
                  de <strong className="text-slate-900">{sortedData.length}</strong> registros
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </button>
                  <span className="px-2 font-semibold text-slate-800">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================================================================== */}
        {/* ABA 2: PERGUNTAS DE NEGÓCIO & INSIGHTS (BIG DATA Q&A)              */}
        {/* ================================================================== */}
        {activeTab === 'qa' && (
          <div className="space-y-6">
            {/* Banner Explicativo da Etapa Acadêmica */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-sm border border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    <Briefcase className="w-4 h-4" />
                    Roteiro Analítico — Projeto de Análise de Dados & Big Data
                  </div>
                  <h2 className="text-xl font-bold">
                    6 Questões Estratégicas sobre Empregos Formais no Turismo (2025)
                  </h2>
                  <p className="text-sm text-slate-300 max-w-3xl">
                    Cada card abaixo apresenta uma <strong>prévia dinâmica calculada sobre a amostra mockada</strong>{' '}
                    (prova de conceito da lógica analítica) e um <strong>espaço estruturado editável</strong> para
                    documentar a query SQL/Python e os resultados oficiais após o processamento do dataset completo.
                  </p>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-center shrink-0">
                  <div className="text-2xl font-bold text-emerald-400">
                    {answeredCount} <span className="text-sm text-slate-400 font-normal">/ 6</span>
                  </div>
                  <div className="text-xs text-slate-300">Respostas Oficiais Preenchidas</div>
                </div>
              </div>
            </div>

            {/* Lista das 6 Perguntas */}
            <div className="space-y-4">
              {INITIAL_QUESTIONS.map((q) => {
                const note = qaNotes[q.id] || {
                  answer: '',
                  query: q.defaultQuery,
                  status: 'pending',
                  updatedAt: null
                };
                const isExpanded = !!expandedQuestionIds[q.id];
                const isEditing = editingQuestionId === q.id;
                const isAnswered = note.status === 'answered';

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-xl border transition shadow-sm overflow-hidden ${
                      isAnswered ? 'border-emerald-200' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Cabeçalho Clicável do Card */}
                    <div
                      onClick={() => toggleQuestionExpand(q.id)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <span className="w-8 h-8 rounded-lg bg-slate-900 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0">
                          {q.number}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {q.tag}
                            </span>
                            {isAnswered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Respondida (Base Oficial)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Aguardando Base Completa
                              </span>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">{q.title}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-xs font-medium text-slate-500">
                          {isExpanded ? 'Recolher' : 'Expandir análise'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Corpo Expansível */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-5 bg-slate-50/40">
                        {/* Metodologia */}
                        <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-white p-3.5 rounded-lg border border-slate-200/70">
                          <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800">Abordagem de Engenharia de Dados:</strong>{' '}
                            {q.methodology}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {/* COLUNA ESQUERDA: PREVIEW DINÂMICO (BASE MOCKADA) */}
                          <div className="bg-white rounded-xl border border-cyan-100 p-4 shadow-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Preview Dinâmico (Amostra Mockada)
                                </span>
                                <span className="text-[11px] text-slate-400">Calculado em tempo real</span>
                              </div>

                              {/* Renderização específica para cada uma das 6 perguntas */}
                              {q.id === 'q1' && (
                                <div className="space-y-2.5">
                                  {dynamicQuestionPreviews.q1.map((item, idx) => (
                                    <div
                                      key={item.label}
                                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-cyan-700">#{idx + 1}</span>
                                        <span className="font-semibold text-slate-800">{item.label}</span>
                                      </div>
                                      <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                                        {item.count} vínculos
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.id === 'q2' && (
                                <div className="space-y-2.5">
                                  {dynamicQuestionPreviews.q2.map((item, idx) => (
                                    <div
                                      key={item.mes}
                                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-emerald-700">#{idx + 1}</span>
                                        <span className="font-semibold text-slate-800">{item.mes}</span>
                                      </div>
                                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                        {item.count} admissões
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.id === 'q3' && (
                                <div className="space-y-2.5">
                                  {dynamicQuestionPreviews.q3.map((item, idx) => (
                                    <div
                                      key={item.label}
                                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                    >
                                      <div>
                                        <span className="font-bold text-cyan-700 mr-2">#{idx + 1}</span>
                                        <span className="font-semibold text-slate-800">{item.label}</span>
                                        <span className="text-[11px] text-slate-500 ml-1.5">
                                          ({item.count} reg.)
                                        </span>
                                      </div>
                                      <span className="font-bold text-emerald-700">
                                        {formatCurrency(item.avgSal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.id === 'q4' && (
                                <div className="space-y-2.5">
                                  {dynamicQuestionPreviews.q4.map((item, idx) => (
                                    <div
                                      key={item.subclasse}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-cyan-700">
                                          #{idx + 1} • {item.act}
                                        </span>
                                        <span className="font-bold text-emerald-700">
                                          {formatCurrency(item.avgSal)}
                                        </span>
                                      </div>
                                      <p className="text-slate-700 line-clamp-1" title={item.subclasse}>
                                        {item.subclasse}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.id === 'q5' && (
                                <div className="space-y-2.5">
                                  {dynamicQuestionPreviews.q5.map((item, idx) => (
                                    <div
                                      key={`${item.city}-${item.mes}`}
                                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                    >
                                      <div>
                                        <span className="font-bold text-cyan-700 mr-1.5">#{idx + 1}</span>
                                        <span className="font-semibold text-slate-800">{item.city}</span>
                                        <span className="ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium text-[11px]">
                                          Mês: {item.mes}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-emerald-700">
                                          {formatCurrency(item.avgSal)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {item.count} contratações
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.id === 'q6' && (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                  {dynamicQuestionPreviews.q6.map((item) => (
                                    <div
                                      key={item.act}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                                    >
                                      <div className="flex items-center justify-between font-semibold text-slate-800">
                                        <span className="text-cyan-800">{item.act}</span>
                                        <span className="text-slate-600">
                                          Classe {item.classe} ({item.count} reg.)
                                        </span>
                                      </div>
                                      <p className="text-slate-600 mt-0.5 truncate" title={item.topSubclasse}>
                                        Líder: {item.topSubclasse}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <p className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                              * Resultados preliminares extraídos dos 40 registros mockados.
                            </p>
                          </div>

                          {/* COLUNA DIREITA: ESPAÇO EDITÁVEL PARA RESPOSTA OFICIAL / QUERY */}
                          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                                  Espaço para Resposta Oficial (Dataset 2025)
                                </span>

                                {!isEditing && (
                                  <button
                                    onClick={() => startEditingQuestion(q.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-cyan-600 text-white transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    {isAnswered ? 'Editar Resposta' : 'Inserir Resposta'}
                                  </button>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                      Conclusão / Insights Obtidos da Base Completa:
                                    </label>
                                    <textarea
                                      rows={4}
                                      value={draftAnswer}
                                      onChange={(e) => setDraftAnswer(e.target.value)}
                                      placeholder="Cole aqui os resultados finais, rankings e conclusões após rodar o processamento na base real do MTur 2025..."
                                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                      Query SQL / Script Python (Pandas/PySpark) Utilizado:
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={draftQuery}
                                      onChange={(e) => setDraftQuery(e.target.value)}
                                      className="w-full p-2.5 font-mono text-xs bg-slate-900 text-cyan-300 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setEditingQuestionId(null)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => saveQuestionNote(q.id)}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      Salvar Resultado
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {isAnswered ? (
                                    <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-sm text-slate-800 whitespace-pre-line">
                                      {note.answer}
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => startEditingQuestion(q.id)}
                                      className="p-4 rounded-lg border-2 border-dashed border-slate-200 hover:border-cyan-400 bg-slate-50/60 text-center cursor-pointer transition"
                                    >
                                      <p className="text-xs font-medium text-slate-600">
                                        Placeholder reservado para os achados oficiais da base RAIS 2025.
                                      </p>
                                      <p className="text-[11px] text-cyan-700 font-semibold mt-1">
                                        + Clique aqui para registrar a resposta e o código da análise
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                                      Query Analítica de Referência:
                                    </span>
                                    <pre className="p-2.5 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto">
                                      {note.query}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>

                            {note.updatedAt && (
                              <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-right">
                                Última atualização: {note.updatedAt}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL DE INSPEÇÃO DE LINHA ÚNICA (TODOS OS 21 CAMPOS)                */}
      {/* ==================================================================== */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Inspeção Completa do Registro • ID #{selectedRow.Id}
                </span>
                <h3 className="text-lg font-bold">
                  {selectedRow.Municipio} ({selectedRow.UF}) — {selectedRow.ACT}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {SCHEMA_COLUMNS.map((col) => {
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
                  <div
                    key={col.key}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-800 font-mono">{col.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                        {col.category}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 break-words">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DICIONÁRIO DE DADOS (SCHEMA OFICIAL - 21 COLUNAS)              */}
      {/* ==================================================================== */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Dicionário de Dados & Metadados
                </span>
                <h3 className="text-lg font-bold">
                  Schema Oficial — Empregos Formais no Turismo (RAIS / MTur 2025)
                </h3>
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-xs text-slate-600 mb-4">
                Estrutura completa das <strong>21 colunas</strong> extraídas do portal de Dados Abertos do
                Ministério do Turismo (vínculos CLT e estatutários ativos em 31/12 nas 8 Atividades Características do Turismo).
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Coluna</th>
                      <th className="py-2.5 px-3">Tipo SQL</th>
                      <th className="py-2.5 px-3">Dimensão</th>
                      <th className="py-2.5 px-3">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SCHEMA_COLUMNS.map((col, idx) => (
                      <tr key={col.key} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-800">{col.key}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{col.type}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {col.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{col.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">Fonte: dados.turismo.gov.br (RAIS 2025)</span>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
