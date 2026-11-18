import React, { useEffect, useState } from 'react';
import { ArrowLeft, Compass, Copy, Loader2, Plus, Search, Sparkles, Trash2, Tv } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useApp } from '../contexts/AppContext';
import { aiApi, fsApi, type FsDoc } from '../lib/dataClient';
import { buildCanalDoc, canalDetailRoute, canalDocPath, canaisCollectionPath, filterCanaisVisiveis } from '../lib/canaisLogic';
import { buildIdeiaDoc, ideiaDocPath, ideiasCollectionPath, isIdeiaTituloValido } from '../lib/ideiasLogic';
import { buildResultadosPesquisa, filterResultadosPesquisa, pesquisaCollectionPaths, queryFromSearchParams } from '../lib/pesquisaLogic';
import { playbookCollectionPath } from '../lib/playbookLogic';
import { Link, navigate, useLocationPath } from '../lib/router';

export interface CanalDoc {
  nome: string;
  handle: string;
  nicho: string;
  tipo: 'proprio' | 'referencia';
  inscritos: number;
  views30d: number;
  ctrMedio: number;
  retencaoMedia: number;
  frequenciaSemanal: number;
  descricao: string;
  analiseIa?: string;
}

export function ChannelsListView({ mode }: { mode: 'proprios' | 'todos' }) {
  const { user, notify } = useApp();
  const [canais, setCanais] = useState<FsDoc<CanalDoc>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [nome, setNome] = useState('');
  const [handle, setHandle] = useState('');
  const [nicho, setNicho] = useState('');
  const [tipo, setTipo] = useState<'proprio' | 'referencia'>(mode === 'proprios' ? 'proprio' : 'referencia');
  const [inscritos, setInscritos] = useState('10000');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<CanalDoc>(canaisCollectionPath(user.id));
      setCanais(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setCanais([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar canais.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, mode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nome.trim()) return;
    await fsApi.createDoc(canaisCollectionPath(user.id), buildCanalDoc({ nome, handle, nicho, tipo, inscritos, modoLista: mode }));
    setNome('');
    setHandle('');
    setNicho('');
    setCreating(false);
    notify('Canal cadastrado.', 'ok');
    void load();
  };

  const safeCanais = Array.isArray(canais) ? canais : [];
  const visible = filterCanaisVisiveis(safeCanais, mode);

  return (
    <AppShell
      title={mode === 'proprios' ? 'Meus Canais' : 'Canais & Referências'}
      breadcrumb={mode === 'proprios' ? 'Ativos' : 'Inteligência'}
      primaryAction={
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{creating ? 'Fechar' : 'Adicionar Canal'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {creating && (
          <form onSubmit={handleCreate} className="vy-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Cadastrar Canal
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do canal"
                className="vy-input px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@handle"
                className="vy-input px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
                placeholder="Nicho"
                className="vy-input px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={inscritos}
                onChange={(e) => setInscritos(e.target.value)}
                placeholder="Inscritos"
                className="vy-input px-3 py-2 text-sm font-mono-num"
              />
              {mode === 'todos' && (
                <select value={tipo} onChange={(e) => setTipo(e.target.value as 'proprio' | 'referencia')} className="vy-input px-3 py-2 text-sm">
                  <option value="referencia">Referência</option>
                  <option value="proprio">Próprio</option>
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="vy-btn-secondary px-4 py-2 text-xs">Cancelar</button>
              <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium">Salvar Canal</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="vy-card p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="vy-card p-10 text-center space-y-3">
            <Tv className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum canal cadastrado nesta visão.
            </p>
            <button type="button" onClick={() => setCreating(true)} className="vy-btn-primary px-4 py-2 text-xs font-medium">
              Adicionar Primeiro Canal
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((c) => (
              <div key={c.id} className="vy-card p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={canalDetailRoute(c.id)}
                      className="font-display font-semibold text-base hover:underline truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {c.data.nome}
                    </Link>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {c.data.tipo === 'referencia' ? 'Referência' : 'Próprio'}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {c.data.handle} · {c.data.nicho}
                  </div>
                  {c.data.descricao && (
                    <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--text-muted)' }}>
                      {c.data.descricao}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t grid grid-cols-3 gap-2 text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Inscritos</div>
                    <div className="font-mono-num font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {(Number(c.data.inscritos) || 0).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>CTR Médio</div>
                    <div className="font-mono-num font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {c.data.ctrMedio}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Retenção</div>
                    <div className="font-mono-num font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {c.data.retencaoMedia}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function ChannelDetailView({ id }: { id: string }) {
  const { user, notify } = useApp();
  const [canal, setCanal] = useState<FsDoc<CanalDoc> | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fsApi
      .getDoc<CanalDoc>(canalDocPath(user.id, id))
      .then((res) => {
        setCanal(res.exists ? res : null);
        if (res.exists && res.data.analiseIa) {
          setAnalysisText(res.data.analiseIa);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id, id]);

  const handleAnalyzeChannel = async () => {
    if (!user || !canal) return;
    setAnalyzing(true);
    try {
      const res = await aiApi.action('channel:analyze', {
        canalId: canal.id,
        channel: canal.data,
      });
      const text = res.text || '';
      setAnalysisText(text);
      await fsApi.patchDoc(canalDocPath(user.id, id), { analiseIa: text });
      notify('Análise estratégica do canal gerada.', 'ok');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao analisar canal.', 'err');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    await fsApi.deleteDoc(canalDocPath(user.id, id));
    notify('Canal removido.', 'info');
    navigate('/canais');
  };

  return (
    <AppShell
      title={canal?.data.nome || 'Detalhes do Canal'}
      breadcrumb="Canais"
      primaryAction={
        canal ? (
          <button
            type="button"
            disabled={analyzing}
            onClick={() => void handleAnalyzeChannel()}
            className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
          >
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{analyzing ? 'Analisando canal...' : 'Análise Estratégica (IA)'}</span>
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/canais" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Canais</span>
          </Link>
          {canal && (
            <button type="button" onClick={handleDelete} className="vy-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--status-err)' }}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="vy-card p-8 h-48 animate-pulse" />
        ) : !canal ? (
          <div className="vy-card p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Canal não encontrado.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="vy-card p-6 space-y-6">
              <div className="space-y-1">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {canal.data.handle} · {canal.data.nicho} · {canal.data.tipo === 'referencia' ? 'Referência de Mercado' : 'Canal Próprio'}
                </div>
                <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                  {canal.data.nome}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {canal.data.descricao || 'Sem descrição editorial registrada.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Inscritos</div>
                  <div className="font-mono-num text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {(Number(canal.data.inscritos) || 0).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Views (30d)</div>
                  <div className="font-mono-num text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {(Number(canal.data.views30d) || 0).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>CTR Médio</div>
                  <div className="font-mono-num text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {canal.data.ctrMedio}%
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Retenção Média</div>
                  <div className="font-mono-num text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {canal.data.retencaoMedia}%
                  </div>
                </div>
              </div>
            </div>

            {analysisText && (
              <div className="vy-card p-6 space-y-4" style={{ borderColor: 'var(--accent)' }}>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-hairline)' }}>
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                    <Sparkles className="w-4 h-4" />
                    <span>Diagnóstico Estratégico do Canal (IA)</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(analysisText).catch(() => undefined);
                        notify('Diagnóstico copiado.', 'info');
                      }}
                      className="vy-btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalysisText('')}
                      className="vy-btn-secondary px-2.5 py-1 text-xs"
                    >
                      Ocultar
                    </button>
                  </div>
                </div>
                <MarkdownRenderer
                  content={analysisText}
                  renderListItemAction={({ text, heading }) => {
                    const clean = text.replace(/\*\*/g, '').trim();
                    if (/ideias de v[íi]deo/i.test(heading || '')) {
                      return (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) return;
                            const created = await fsApi.createDoc(`usuarios/${user.id}/projetos`, {
                              titulo: clean.slice(0, 90),
                              canalId: canal.id,
                              canalNome: canal.data.nome,
                              estagio: 'ideacao',
                              formato: 'long',
                              prioridade: 'media',
                              dataPublicacaoAlvo: '',
                              ctrAlvo: Number(canal.data.ctrMedio || 7.5),
                              ganchoResumo: '',
                              resumo: `Ideia sugerida pela análise estratégica do canal ${canal.data.nome}.`,
                              checklist: [{ id: 'c1', texto: 'Validar título e ângulo do vídeo', feito: false }],
                              versaoAtual: 1,
                            });
                            notify('Projeto criado no Kanban.', 'ok');
                            navigate(`/projetos/${created.id}`);
                          }}
                          className="vy-btn-primary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                        >
                          + Criar Projeto
                        </button>
                      );
                    }
                    if (/recomenda[çc][õo]es/i.test(heading || '')) {
                      return (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) return;
                            await fsApi.createDoc(playbookCollectionPath(user.id), {
                              categoria: 'estrategia',
                              titulo: `Canal ${canal.data.nome} — Recomendação`,
                              regra: clean,
                              impacto: 'Diagnóstico estratégico do canal',
                            });
                            notify('Recomendação salva no Playbook.', 'ok');
                          }}
                          className="vy-btn-secondary px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                        >
                          + Playbook
                        </button>
                      );
                    }
                    return null;
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function ExploreView() {
  const { user, notify } = useApp();
  const [ideias, setIdeias] = useState<FsDoc<{ titulo: string; nicho: string; potencial: string; origem: string; notas: string }>[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [nicho, setNicho] = useState('');
  const [notas, setNotas] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<{ titulo: string; nicho: string; potencial: string; origem: string; notas: string }>(
        ideiasCollectionPath(user.id)
      );
      setIdeias(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setIdeias([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar ideias.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isIdeiaTituloValido(titulo)) return;
    await fsApi.createDoc(ideiasCollectionPath(user.id), buildIdeiaDoc({ titulo, nicho, notas }));
    setTitulo('');
    setNicho('');
    setNotas('');
    notify('Ideia salva.', 'ok');
    void load();
  };

  const promote = async (doc: FsDoc<{ titulo: string; nicho: string; notas: string }>) => {
    if (!user) return;
    const created = await fsApi.createDoc(`usuarios/${user.id}/projetos`, {
      titulo: doc.data.titulo,
      canalNome: 'Canal Principal',
      estagio: 'ideacao',
      formato: 'long',
      prioridade: 'media',
      dataPublicacaoAlvo: '',
      ctrAlvo: 8.0,
      ganchoResumo: doc.data.notas || '',
      checklist: [{ id: 'c1', texto: 'Definir título e capa', feito: false }],
      versaoAtual: 1,
    });
    notify('Ideia promovida para o Kanban.', 'ok');
    navigate(`/projetos/${created.id}`);
  };

  return (
    <AppShell title="Explorar Ideias & Pautas" breadcrumb="Inteligência">
      <div className="space-y-6">
        <form onSubmit={handleAddIdea} className="vy-card p-5 space-y-3">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Compass className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>Capturar Nova Ideia de Vídeo</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título ou ângulo da pauta"
              className="vy-input px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="text"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder="Nicho"
              className="vy-input px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observação rápida ou referência..."
              className="vy-input flex-1 px-3 py-2 text-sm"
            />
            <button type="submit" className="vy-btn-primary px-4 py-2 text-xs font-medium whitespace-nowrap">
              Salvar Ideia
            </button>
          </div>
        </form>

        {loading ? (
          <div className="vy-card p-8 h-40 animate-pulse" />
        ) : ideias.length === 0 ? (
          <div className="vy-card p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhuma ideia registrada ainda.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideias.map((idea) => (
              <div key={idea.id} className="vy-card p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {idea.data.nicho} · Origem: {idea.data.origem}
                  </div>
                  <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {idea.data.titulo}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {idea.data.notas || 'Sem observações adicionais.'}
                  </p>
                </div>
                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-hairline)' }}>
                  <button
                    type="button"
                    onClick={() => void promote(idea)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Enviar para Kanban
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fsApi.deleteDoc(ideiaDocPath(user!.id, idea.id));
                      void load();
                    }}
                    className="text-xs opacity-75 hover:opacity-100"
                    style={{ color: 'var(--status-err)' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function GlobalSearchView() {
  const { user } = useApp();
  const { searchParams } = useLocationPath();
  const [query, setQuery] = useState(queryFromSearchParams(searchParams));
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Array<{ tipo: string; titulo: string; subtitulo: string; to: string }>>([]);

  useEffect(() => {
    setQuery(queryFromSearchParams(searchParams));
  }, [searchParams.get('q')]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const paths = pesquisaCollectionPaths(user.id);
    Promise.all([
      fsApi.listDocs<{ titulo: string; canalNome: string; estagio: string }>(paths.projetos),
      fsApi.listDocs<{ nome: string; nicho: string }>(paths.canais),
      fsApi.listDocs<{ titulo: string; categoria: string }>(paths.notas),
      fsApi.listDocs<{ nome: string; nicho: string }>(paths.radar),
    ])
      .then(([projs, canais, notas, radar]) => {
        setResults(buildResultadosPesquisa({ projetos: projs, canais, notas, radar }));
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = filterResultadosPesquisa(results, query);

  return (
    <AppShell title="Pesquisa no Estúdio" breadcrumb="Inteligência">
      <div className="space-y-6">
        <div className="vy-card p-4 flex items-center gap-3">
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar em projetos, canais, notas e perfis do Radar..."
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {loading ? (
          <div className="vy-card p-8 h-40 animate-pulse" />
        ) : filtered.length === 0 ? (
          <div className="vy-card p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nenhum resultado encontrado para "{query}".
          </div>
        ) : (
          <div className="vy-card divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {filtered.map((item, idx) => (
              <Link key={idx} to={item.to} className="flex items-center justify-between px-5 py-3.5 hover:opacity-80">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.titulo}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.subtitulo}</div>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{item.tipo}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
