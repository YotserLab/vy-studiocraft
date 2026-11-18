import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Plus, Radar, Sparkles, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../contexts/AppContext';
import { aiApi, fsApi, type FsDoc } from '../lib/dataClient';
import { Link, navigate } from '../lib/router';

export interface RadarPerfil {
  nome: string;
  nicho: string;
  formato: string;
  aceleracao: 'alta' | 'media' | 'baixa';
  taxaOutliers: number;
  viewsMedias7d: number;
  concorrencia: string;
  sinais: string[];
  topicosQuentes: string[];
  ultimoSinalAt: number;
}

interface RadarDnaResult {
  acontecendo?: string;
  assunto?: string;
  formato?: string;
  gatilho?: string;
  titulo?: string;
  thumbnail?: string;
  narrativa?: string;
  porque_canal?: string;
}

interface RadarPautaResult {
  titulo: string;
  angulo: string;
  gancho: string;
  estrutura: string[];
  thumbnail: string;
}

export function RadarListView() {
  const { user, notify } = useApp();
  const [items, setItems] = useState<FsDoc<RadarPerfil>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAccel, setFilterAccel] = useState<'todos' | 'alta' | 'media' | 'baixa'>('todos');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [clustering, setClustering] = useState(false);

  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [formato, setFormato] = useState('Long (10-15 min)');
  const [aceleracao, setAceleracao] = useState<'alta' | 'media' | 'baixa'>('alta');
  const [taxaOutliers, setTaxaOutliers] = useState('3.0');
  const [sinalInicial, setSinalInicial] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<RadarPerfil>(`usuarios/${user.id}/radar_perfis`);
      setItems(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setItems([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar Radar.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (!user) return;
    return fsApi.subscribe(`usuarios/${user.id}/radar_perfis`, () => {
      void load();
    });
  }, [user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nome.trim()) return;
    try {
      await fsApi.createDoc(`usuarios/${user.id}/radar_perfis`, {
        nome: nome.trim(),
        nicho: nicho.trim() || 'Geral',
        formato,
        aceleracao,
        taxaOutliers: Number.parseFloat(taxaOutliers) || 2.0,
        viewsMedias7d: 25000,
        concorrencia: 'Média',
        sinais: sinalInicial.trim() ? [sinalInicial.trim()] : ['Sinal inicial registrado manualmente.'],
        topicosQuentes: [nicho.trim() || nome.trim()],
        ultimoSinalAt: Date.now(),
      });
      setNome('');
      setNicho('');
      setSinalInicial('');
      setCreating(false);
      notify('Perfil adicionado ao Radar.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao criar perfil.', 'err');
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  const handleNormalizeClusters = async () => {
    if (!user || safeItems.length === 0) return;
    setClustering(true);
    try {
      const groups = safeItems.map((it) => [
        it.data?.nome || '',
        it.data?.nicho || '',
        ...(Array.isArray(it.data?.topicosQuentes) ? it.data.topicosQuentes : []).slice(0, 2),
      ]);
      const res = await aiApi.action<string[]>('radar:cluster_names', { groups });
      const names = Array.isArray(res.data) ? res.data : [];
      for (let i = 0; i < safeItems.length; i += 1) {
        const cleanName = names[i]?.trim();
        if (cleanName) {
          await fsApi.patchDoc(`usuarios/${user.id}/radar_perfis/${safeItems[i].id}`, { nome: cleanName });
        }
      }
      notify('Nomes dos assuntos normalizados via IA.', 'ok');
      void load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao nomear assuntos.', 'err');
    } finally {
      setClustering(false);
    }
  };

  const filtered = safeItems.filter((item) => {
    const d = item?.data;
    if (!d) return false;
    if (filterAccel !== 'todos' && d.aceleracao !== filterAccel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.nome?.toLowerCase().includes(q) ||
        d.nicho?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AppShell
      title="Radar de Nichos"
      breadcrumb="Inteligência"
      primaryAction={
        <div className="flex items-center gap-2">
          {safeItems.length > 0 && (
            <button
              type="button"
              disabled={clustering}
              onClick={() => void handleNormalizeClusters()}
              className="vy-btn-secondary px-3 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
            >
              {clustering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
              <span>{clustering ? 'Normalizando...' : 'Nomear Assuntos (IA)'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Fechar' : 'Novo Perfil'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {creating && (
          <form onSubmit={handleCreate} className="vy-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Monitorar novo nicho ou sub-tema
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do tema / perfil"
                className="vy-input px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
                placeholder="Nicho (ex: IA & Automação)"
                className="vy-input px-3 py-2 text-sm"
              />
              <select
                value={aceleracao}
                onChange={(e) => setAceleracao(e.target.value as 'alta' | 'media' | 'baixa')}
                className="vy-input px-3 py-2 text-sm"
              >
                <option value="alta">Aceleração Alta</option>
                <option value="media">Aceleração Média</option>
                <option value="baixa">Aceleração Baixa</option>
              </select>
              <input
                type="number"
                step="0.1"
                value={taxaOutliers}
                onChange={(e) => setTaxaOutliers(e.target.value)}
                placeholder="Taxa outliers (ex: 3.5)"
                className="vy-input px-3 py-2 text-sm font-mono-num"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                placeholder="Formato dominante"
                className="vy-input px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={sinalInicial}
                onChange={(e) => setSinalInicial(e.target.value)}
                placeholder="Observação do sinal detectado"
                className="vy-input px-3 py-2 text-sm sm:col-span-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="vy-btn-secondary px-4 py-2 text-xs">
                Cancelar
              </button>
              <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">
                Salvar no Radar
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}>
            {(['todos', 'alta', 'media', 'baixa'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilterAccel(level)}
                className="px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: filterAccel === level ? 'var(--accent-soft)' : 'transparent',
                  color: filterAccel === level ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {level === 'todos' ? 'Todos' : `Aceleração ${level}`}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar perfis..."
            className="vy-input px-3 py-1.5 text-sm w-full sm:w-64"
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="vy-card p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="vy-card p-10 text-center space-y-3">
            <Radar className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum perfil encontrado com os filtros atuais.
            </p>
            <button type="button" onClick={() => setCreating(true)} className="vy-btn-primary px-4 py-2 text-xs font-medium">
              Adicionar Primeiro Perfil
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="vy-card p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/radar/perfis/${item.id}`}
                      className="font-display font-semibold text-base hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.data.nome}
                    </Link>
                    <span
                      className="text-xs font-mono-num shrink-0"
                      style={{
                        color:
                          item.data.aceleracao === 'alta'
                            ? 'var(--status-ok)'
                            : item.data.aceleracao === 'media'
                              ? 'var(--status-warn)'
                              : 'var(--text-muted)',
                      }}
                    >
                      Aceleração {item.data.aceleracao}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.data.nicho} · {item.data.formato} · Concorrência {item.data.concorrencia}
                  </div>
                  {item.data.sinais?.[0] && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {item.data.sinais[0]}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
                  <span className="font-mono-num" style={{ color: 'var(--text-secondary)' }}>
                    {item.data.taxaOutliers}x outliers · {(Number(item.data.viewsMedias7d) || 0).toLocaleString('pt-BR')} views/7d
                  </span>
                  <Link to={`/radar/perfis/${item.id}`} className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                    Abrir sinais
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function RadarProfileDetailView({ id }: { id: string }) {
  const { user, notify } = useApp();
  const [doc, setDoc] = useState<FsDoc<RadarPerfil> | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSignal, setNewSignal] = useState('');
  const [dnaBusy, setDnaBusy] = useState(false);
  const [pautaBusy, setPautaBusy] = useState(false);
  const [dna, setDna] = useState<RadarDnaResult | null>(null);
  const [pauta, setPauta] = useState<RadarPautaResult | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fsApi.getDoc<RadarPerfil>(`usuarios/${user.id}/radar_perfis/${id}`);
      setDoc(res.exists ? res : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, id]);

  const handleAddSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !doc || !newSignal.trim()) return;
    const updatedSinais = [newSignal.trim(), ...(doc.data.sinais || [])];
    await fsApi.patchDoc(`usuarios/${user.id}/radar_perfis/${id}`, {
      sinais: updatedSinais,
      ultimoSinalAt: Date.now(),
    });
    setNewSignal('');
    notify('Sinal adicionado.', 'ok');
    void load();
  };

  const handleAnalyzeDna = async () => {
    if (!doc) return;
    setDnaBusy(true);
    try {
      const res = await aiApi.action<RadarDnaResult>('radar:dna', {
        nome: doc.data.nome,
        nicho: doc.data.nicho,
        topicosQuentes: doc.data.topicosQuentes,
        sinais: doc.data.sinais,
        taxaOutliers: doc.data.taxaOutliers,
        viewsMedias7d: doc.data.viewsMedias7d,
      });
      if (res.data) {
        setDna(res.data);
        notify('DNA da oportunidade extraído.', 'ok');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao analisar DNA.', 'err');
    } finally {
      setDnaBusy(false);
    }
  };

  const handleGeneratePauta = async () => {
    if (!doc) return;
    setPautaBusy(true);
    try {
      const res = await aiApi.action<RadarPautaResult>('radar:pauta', {
        nome: doc.data.nome,
        nicho: doc.data.nicho,
        sinais: doc.data.sinais,
        dna,
      });
      if (res.data) {
        setPauta(res.data);
        notify('Pauta original gerada.', 'ok');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao gerar pauta.', 'err');
    } finally {
      setPautaBusy(false);
    }
  };

  const handleCreateFromPauta = async () => {
    if (!user || !doc || !pauta) return;
    const capitulos = (pauta.estrutura || []).map((part, idx) => ({
      id: `cap_${idx + 1}`,
      titulo: `${String(idx + 1).padStart(2, '0')} — ${part}`,
      texto: idx === 0 ? pauta.gancho : '',
    }));
    const created = await fsApi.createDoc(`usuarios/${user.id}/projetos`, {
      titulo: pauta.titulo,
      canalNome: 'Canal Principal',
      estagio: 'ideacao',
      formato: doc.data.formato?.toLowerCase().includes('short') ? 'shorts' : 'long',
      prioridade: doc.data.aceleracao === 'alta' ? 'alta' : 'media',
      dataPublicacaoAlvo: '',
      ctrAlvo: 8.5,
      ganchoResumo: pauta.gancho,
      resumo: pauta.angulo,
      thumbConceito: pauta.thumbnail,
      capitulos,
      checklist: [{ id: 'c1', texto: 'Revisar gancho e fontes da pauta', feito: false }],
      origemRadarId: doc.id,
      versaoAtual: 1,
    });
    notify('Projeto criado com a pauta original.', 'ok');
    navigate(`/projetos/${created.id}`);
  };

  const handlePromoteToProject = async () => {
    if (!user || !doc) return;
    const created = await fsApi.createDoc(`usuarios/${user.id}/projetos`, {
      titulo: `Pauta Radar: ${doc.data.nome}`,
      canalNome: 'Tech & Automação BR',
      estagio: 'ideacao',
      formato: doc.data.formato?.toLowerCase().includes('short') ? 'shorts' : 'long',
      prioridade: doc.data.aceleracao === 'alta' ? 'alta' : 'media',
      dataPublicacaoAlvo: '',
      ctrAlvo: 8.0,
      ganchoResumo: doc.data.sinais?.[0] || '',
      checklist: [{ id: 'c1', texto: 'Definir título e conceito de thumbnail', feito: false }],
      origemRadarId: doc.id,
      versaoAtual: 1,
    });
    notify('Pauta convertida em projeto Kanban.', 'ok');
    navigate(`/projetos/${created.id}`);
  };

  const handleDelete = async () => {
    if (!user || !doc) return;
    await fsApi.deleteDoc(`usuarios/${user.id}/radar_perfis/${id}`);
    notify('Perfil removido do Radar.', 'info');
    navigate('/radar');
  };

  return (
    <AppShell
      title={doc?.data.nome || 'Perfil do Radar'}
      breadcrumb="Radar"
      primaryAction={
        doc ? (
          <button
            type="button"
            onClick={handlePromoteToProject}
            className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
          >
            Converter em Projeto
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/radar" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Radar</span>
          </Link>
          {doc && (
            <button type="button" onClick={handleDelete} className="vy-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--status-err)' }}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover Perfil</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="vy-card p-8 animate-pulse h-48" />
        ) : !doc ? (
          <div className="vy-card p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Perfil não encontrado.
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {/* AI Actions Card */}
              <div className="vy-card p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Extrair padrão de retenção e transformar oportunidade em pauta original:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={dnaBusy}
                    onClick={() => void handleAnalyzeDna()}
                    className="vy-btn-secondary px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    {dnaBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />}
                    <span>Análise DNA (IA)</span>
                  </button>
                  <button
                    type="button"
                    disabled={pautaBusy}
                    onClick={() => void handleGeneratePauta()}
                    className="vy-btn-primary px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    {pautaBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Gerar Pauta Original (IA)</span>
                  </button>
                </div>
              </div>

              {dna && (
                <div className="vy-card p-5 space-y-3" style={{ borderColor: 'var(--accent)' }}>
                  <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                    DNA da Oportunidade
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {dna.acontecendo}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Assunto:</strong> <span style={{ color: 'var(--text-secondary)' }}>{dna.assunto}</span></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Formato:</strong> <span style={{ color: 'var(--text-secondary)' }}>{dna.formato}</span></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Gatilho:</strong> <span style={{ color: 'var(--text-secondary)' }}>{dna.gatilho}</span></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Padrão de Título:</strong> <span style={{ color: 'var(--text-secondary)' }}>{dna.titulo}</span></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Thumbnail:</strong> <span style={{ color: 'var(--text-secondary)' }}>{dna.thumbnail}</span></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Narrativa:</strong> <span style={{ color: 'var(--text-secondary)' }}>{dna.narrativa}</span></div>
                  </div>
                  {dna.porque_canal && (
                    <div className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                      <strong>Fit com seus canais:</strong> {dna.porque_canal}
                    </div>
                  )}
                </div>
              )}

              {pauta && (
                <div className="vy-card p-5 space-y-3" style={{ borderColor: 'var(--accent)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                      Pauta Original Sugerida
                    </h3>
                    <button
                      type="button"
                      onClick={() => void handleCreateFromPauta()}
                      className="vy-btn-primary px-3 py-1.5 text-xs font-medium"
                    >
                      Criar Projeto com esta Pauta
                    </button>
                  </div>
                  <div className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {pauta.titulo}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Ângulo:</strong> {pauta.angulo}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <strong>Gancho:</strong> {pauta.gancho}
                  </p>
                  <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Estrutura em partes:</strong>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {(pauta.estrutura || []).map((part, i) => (
                        <li key={i}>{part}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <strong>Thumbnail:</strong> {pauta.thumbnail}
                  </div>
                </div>
              )}

              <div className="vy-card p-6 space-y-4">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {doc.data.nicho} · {doc.data.formato} · Concorrência {doc.data.concorrencia}
                </div>
                <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                  Sinais de Aceleração Observados
                </h2>
                <form onSubmit={handleAddSignal} className="flex gap-2">
                  <input
                    type="text"
                    value={newSignal}
                    onChange={(e) => setNewSignal(e.target.value)}
                    placeholder="Registrar novo sinal ou vídeo outlier observado..."
                    className="vy-input flex-1 px-3 py-2 text-sm"
                  />
                  <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Adicionar Sinal
                  </button>
                </form>
                <ul className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                  {(doc.data.sinais || []).map((s, idx) => (
                    <li key={idx} className="py-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="vy-card p-5 space-y-3">
                <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Métricas de Referência
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Aceleração</span>
                    <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{doc.data.aceleracao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Taxa Outliers</span>
                    <span className="font-mono-num font-medium" style={{ color: 'var(--text-primary)' }}>{doc.data.taxaOutliers}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Views Médias (7d)</span>
                    <span className="font-mono-num font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(Number(doc.data.viewsMedias7d) || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="vy-card p-5 space-y-3">
                <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Tópicos Quentes
                </h3>
                <ul className="space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {(doc.data.topicosQuentes || []).map((t, idx) => (
                    <li key={idx}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
