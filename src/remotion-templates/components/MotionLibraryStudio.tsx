import React, { useState, useMemo } from 'react';
import {
  MOTION_DATA,
  TECHNIQUES,
  SHOTPACK_SHOTS,
  REMOCN_COMPONENTS,
  OPUS_MOTIONS,
  REMOTION_RULES,
  MotionTechnique,
  ShotpackShot,
  RemocnComponent,
  OpusMotion,
} from '../data/motionLibraryData';
import {
  Search,
  BookOpen,
  Code2,
  Film,
  Zap,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Play,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const MotionLibraryStudio: React.FC = () => {
  const [subTab, setSubTab] = useState<'shots' | 'techniques' | 'remocn' | 'opus' | 'rules'>('shots');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Categorias disponíveis para Shots
  const shotCategories = useMemo(() => {
    const set = new Set<string>();
    SHOTPACK_SHOTS.forEach((s) => {
      const cat = s.categoryLabel || s.category;
      if (cat) set.add(cat);
    });
    return ['All', ...Array.from(set).sort()];
  }, []);

  // Categorias para Técnicas
  const techniqueCategories = useMemo(() => {
    const set = new Set<string>();
    TECHNIQUES.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, []);

  // Filtragem de Shots
  const filteredShots = useMemo(() => {
    return SHOTPACK_SHOTS.filter((s) => {
      const matchCat =
        selectedCategory === 'All' ||
        (s.categoryLabel || s.category) === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  // Filtragem de Técnicas
  const filteredTechniques = useMemo(() => {
    return TECHNIQUES.filter((t) => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.ptName && t.ptName.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q) ||
        t.howTo.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  // Filtragem de Remocn
  const filteredRemocn = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return REMOCN_COMPONENTS.slice(0, 60);
    return REMOCN_COMPONENTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.vibe.toLowerCase().includes(q) ||
        c.useFor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [search]);

  // Filtragem de Opus Motion
  const filteredOpus = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return OPUS_MOTIONS.slice(0, 60);
    return OPUS_MOTIONS.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        m.useFor.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900 border border-violet-800/40 p-8 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Motion Library Remotion v2 • 1.900+ Recursos de Movimento
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Enciclopédia de Movimentos & Animações Remotion
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Consulte receitas completas com código TSX, regras de ouro, 173 shots prontos com vídeo MP4, 340 micro-técnicas fundamentais, 825 componentes Remocn e 616 movimentos do Opus Motion.
          </p>
        </div>
      </div>

      {/* Tabs Principais */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => {
            setSubTab('shots');
            setSelectedCategory('All');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            subTab === 'shots'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Film className="w-4 h-4 text-violet-300" />
          <span>Shotpack Shots ({SHOTPACK_SHOTS.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('techniques');
            setSelectedCategory('All');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            subTab === 'techniques'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span>Técnicas Fundamentais ({TECHNIQUES.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('remocn');
            setSelectedCategory('All');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            subTab === 'remocn'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Remocn Components ({REMOCN_COMPONENTS.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('opus');
            setSelectedCategory('All');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            subTab === 'opus'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Opus Motion ({OPUS_MOTIONS.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('rules');
            setSelectedCategory('All');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            subTab === 'rules'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Regras de Ouro Remotion (10)</span>
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      {subTab !== 'rules' && (
        <div className="space-y-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder={`Pesquisar em ${
                subTab === 'shots'
                  ? '173 shots...'
                  : subTab === 'techniques'
                  ? '340 técnicas...'
                  : subTab === 'remocn'
                  ? '825 componentes...'
                  : '616 movimentos...'
              }`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Categorias dos Shots ou Técnicas */}
          {(subTab === 'shots' || subTab === 'techniques') && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-800/80">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Categoria:
              </span>
              {(subTab === 'shots' ? shotCategories : techniqueCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA: SHOTS */}
      {subTab === 'shots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShots.map((shot) => (
            <div
              key={shot.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Vídeo Preview Real MP4 */}
                <div className="relative aspect-[16/9] bg-black overflow-hidden border-b border-slate-800">
                  <video
                    src={shot.preview}
                    muted
                    loop
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md text-violet-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono border border-white/10">
                      {shot.categoryLabel || shot.category}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-white/10">
                      {shot.energy}
                    </span>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                    {shot.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {shot.description}
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 font-mono">
                    <span>⏱ {shot.duration}</span>
                    <span>•</span>
                    <span className="uppercase text-violet-400">{shot.tier}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="p-4 pt-0 border-t border-slate-900 flex items-center justify-between gap-2 mt-2">
                <a
                  href={shot.card}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Prompt Card
                </a>
                <a
                  href={shot.tsx}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600/90 hover:bg-violet-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" /> Ver TSX
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA: TÉCNICAS FUNDAMENTAIS */}
      {subTab === 'techniques' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTechniques.map((tech) => (
            <div
              key={tech.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {tech.name}
                    </span>
                    {tech.ptName && (
                      <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        {tech.ptName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {tech.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tech.description}
                </p>
                {/* Trecho de Código Remotion */}
                <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                  <code>{tech.howTo}</code>
                  <button
                    onClick={() => handleCopy(tech.howTo, tech.id)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Copiar código Remotion"
                  >
                    {copiedId === tech.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {tech.references && tech.references.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-500 overflow-x-auto">
                  <span className="text-slate-400">Refs:</span>
                  {tech.references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:underline flex items-center gap-0.5 whitespace-nowrap"
                    >
                      {new URL(ref).pathname.split('/').pop() || 'docs'}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA: REMOCN COMPONENTS */}
      {subTab === 'remocn' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRemocn.map((comp) => (
            <div
              key={comp.name}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{comp.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
                    {comp.vibe}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-emerald-400 font-semibold">Usar para: </span>
                    <span className="text-slate-300">{comp.useFor}</span>
                  </div>
                  <div>
                    <span className="text-rose-400 font-semibold">Evitar para: </span>
                    <span className="text-slate-400">{comp.avoidFor}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Duração: {comp.length}</span>
                <a
                  href={comp.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  Documentação <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA: OPUS MOTION */}
      {subTab === 'opus' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpus.map((motion) => (
            <div
              key={motion.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-pink-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{motion.title}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-800/40">
                    {motion.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {motion.useFor}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {motion.mood?.slice(0, 4).map((m) => (
                    <span
                      key={m}
                      className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md border border-slate-800"
                    >
                      #{m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  {motion.durationInFrames} frames
                </span>
                <span className="text-slate-400 font-mono text-[11px] truncate max-w-[160px]">
                  {motion.file}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA: 10 REGRAS DE OURO REMOTION */}
      {subTab === 'rules' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              As 10 Regras de Ouro de Animação em Remotion
            </h3>
            <p className="text-sm text-slate-400">
              Diretrizes arquiteturais obrigatórias para criar animações determinísticas, sem falhas de renderização e sem desvios de frame.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REMOTION_RULES.map((rule, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                  {rule}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

