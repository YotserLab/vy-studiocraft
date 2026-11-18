import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Plus, Radar, Sparkles, Tv } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ProjectWizardModal } from '../components/ProjectWizardModal';
import { useApp } from '../contexts/AppContext';
import { fsApi, type FsDoc } from '../lib/dataClient';
import {
  dashboardCollectionPaths,
  meusCanais as filterMeusCanais,
  projetosAtivos as filterProjetosAtivos,
  publisPendentes as filterPublisPendentes,
  sinaisFortesRadar,
  somaInscritos,
  somaViews30d,
} from '../lib/dashboardLogic';
import { Link } from '../lib/router';

interface CanalData {
  nome: string;
  handle: string;
  tipo: string;
  inscritos: number;
  views30d: number;
  ctrMedio: number;
  retencaoMedia: number;
}

interface ProjetoData {
  titulo: string;
  canalNome: string;
  estagio: string;
  formato: string;
  prioridade: string;
  dataPublicacaoAlvo: string;
}

interface PubliData {
  marca: string;
  canalNome: string;
  status: string;
  formato: string;
  valorAcordado: string;
  prazoEntrega: string;
}

interface RadarData {
  nome: string;
  nicho: string;
  aceleracao: string;
  taxaOutliers: number;
  viewsMedias7d: number;
}

const ESTAGIO_LABELS: Record<string, string> = {
  ideacao: 'Ideação',
  roteiro: 'Roteiro',
  gravacao: 'Gravação',
  edicao: 'Edição',
  publicado: 'Publicado',
};

export function OverviewView() {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canais, setCanais] = useState<FsDoc<CanalData>[]>([]);
  const [projetos, setProjetos] = useState<FsDoc<ProjetoData>[]>([]);
  const [publis, setPublis] = useState<FsDoc<PubliData>[]>([]);
  const [radar, setRadar] = useState<FsDoc<RadarData>[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const paths = dashboardCollectionPaths(user.id);
      const [c, p, pb, r] = await Promise.all([
        fsApi.listDocs<CanalData>(paths.canais),
        fsApi.listDocs<ProjetoData>(paths.projetos),
        fsApi.listDocs<PubliData>(paths.publicidade),
        fsApi.listDocs<RadarData>(paths.radar),
      ]);
      setCanais(Array.isArray(c) ? c : []);
      setProjetos(Array.isArray(p) ? p : []);
      setPublis(Array.isArray(pb) ? pb : []);
      setRadar(Array.isArray(r) ? r : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar visão geral.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [user?.id]);

  const meusCanais = filterMeusCanais(Array.isArray(canais) ? canais : []);
  const totalInscritos = somaInscritos(meusCanais);
  const totalViews30d = somaViews30d(meusCanais);
  const projetosAtivos = filterProjetosAtivos(Array.isArray(projetos) ? projetos : []);
  const publisPendentes = filterPublisPendentes(Array.isArray(publis) ? publis : []);

  return (
    <AppShell
      title="Visão Geral"
      breadcrumb="Operação"
      primaryAction={
        // DSH-R06 — a visão geral abre o wizard de criação de projeto (PRJ-R02).
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Projeto (Wizard)</span>
        </button>
      }
    >
      <ProjectWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={() => void loadAll()}
      />
      {error && (
        <div className="vy-card p-4 mb-6 flex items-center justify-between" style={{ borderColor: 'var(--status-err)' }}>
          <span className="text-sm" style={{ color: 'var(--status-err)' }}>{error}</span>
          <button type="button" onClick={loadAll} className="vy-btn-secondary px-3 py-1.5 text-xs">
            Tentar novamente
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="vy-card p-5 space-y-1">
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Canais Próprios
          </div>
          <div className="font-mono-num text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {loading ? '—' : meusCanais.length}
          </div>
          <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
            {totalInscritos.toLocaleString('pt-BR')} inscritos acumulados
          </div>
        </div>

        <div className="vy-card p-5 space-y-1">
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Alcance 30 Dias
          </div>
          <div className="font-mono-num text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {loading ? '—' : totalViews30d.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Visualizações somadas nos canais próprios
          </div>
        </div>

        <div className="vy-card p-5 space-y-1">
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Projetos em Produção
          </div>
          <div className="font-mono-num text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {loading ? '—' : projetosAtivos.length}
          </div>
          <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
            {projetos.filter((p) => p.data.estagio === 'publicado').length} publicados no total
          </div>
        </div>

        <div className="vy-card p-5 space-y-1">
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Publis em Andamento
          </div>
          <div className="font-mono-num text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {loading ? '—' : publisPendentes.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {sinaisFortesRadar(radar).length} sinais fortes no Radar
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Pipeline Recente */}
        <section className="lg:col-span-7 vy-card overflow-hidden">
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Pipeline de Produção
            </h2>
            <Link to="/projetos" className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              <span>Abrir Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-subtle)' }} />
              ))}
            </div>
          ) : projetos.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nenhum projeto cadastrado ainda. Crie seu primeiro vídeo no Kanban ou gere um roteiro com IA.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="vy-btn-primary px-3.5 py-2 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Abrir Wizard de Projeto</span>
                </button>
                <Link to="/roteirista" className="vy-btn-secondary px-3.5 py-2 text-xs font-medium">
                  Abrir Roteirista IA
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-left" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                    <th className="px-5 py-2.5 font-medium">Projeto</th>
                    <th className="px-4 py-2.5 font-medium">Estágio</th>
                    <th className="px-4 py-2.5 font-medium text-right">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.slice(0, 6).map((proj) => (
                    <tr
                      key={proj.id}
                      className="border-b last:border-b-0 transition-colors"
                      style={{ borderColor: 'var(--border-hairline)' }}
                    >
                      <td className="px-5 py-3">
                        <Link to={`/projetos/${proj.id}`} className="font-medium hover:underline block" style={{ color: 'var(--text-primary)' }}>
                          {proj.data.titulo}
                        </Link>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {proj.data.canalNome || 'Sem canal'} · {proj.data.formato === 'shorts' ? 'Shorts' : 'Vídeo Longo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {ESTAGIO_LABELS[proj.data.estagio] || proj.data.estagio}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono-num text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {proj.data.dataPublicacaoAlvo || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column: Radar & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          <section className="vy-card overflow-hidden">
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <h2 className="font-display font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Radar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Sinais do Radar</span>
              </h2>
              <Link to="/radar" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                Ver todos
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-2">
                <div className="h-12 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-subtle)' }} />
                <div className="h-12 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-subtle)' }} />
              </div>
            ) : radar.length === 0 ? (
              <div className="p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nenhum perfil monitorado no Radar.{' '}
                <Link to="/radar" className="underline" style={{ color: 'var(--accent)' }}>
                  Adicionar nicho
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {radar.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    to={`/radar/perfis/${item.id}`}
                    className="block px-5 py-3.5 transition-colors hover:opacity-90"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.data.nome}
                      </span>
                      <span
                        className="text-xs font-mono-num shrink-0"
                        style={{
                          color: item.data.aceleracao === 'alta' ? 'var(--status-ok)' : 'var(--text-secondary)',
                        }}
                      >
                        {item.data.taxaOutliers}x outliers
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.data.nicho} · {(Number(item.data.viewsMedias7d) || 0).toLocaleString('pt-BR')} views/7d
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="vy-card p-5 space-y-3">
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Atalhos de Estúdio
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/roteirista" className="vy-btn-secondary p-3 text-xs font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span>Roteirista IA</span>
              </Link>
              <Link to="/comparar-30s" className="vy-btn-secondary p-3 text-xs font-medium flex items-center gap-2">
                <Tv className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span>Comparar 30s</span>
              </Link>
              <Link to="/noticias" className="vy-btn-secondary p-3 text-xs font-medium flex items-center gap-2">
                <span>Leitor RSS</span>
              </Link>
              <Link to="/biblioteca" className="vy-btn-secondary p-3 text-xs font-medium flex items-center gap-2">
                <span>Biblioteca Mídia</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
