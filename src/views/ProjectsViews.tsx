import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ProjectWizardModal } from '../components/ProjectWizardModal';
import { ProjectWorkspaceTabs, type ProjetoExtendedDoc } from '../components/ProjectWorkspaceTabs';
import { useApp } from '../contexts/AppContext';
import { fsApi, type FsDoc } from '../lib/dataClient';
import {
  applyStageMove,
  deleteProjectDoc,
  KANBAN_STAGES,
  patchProjectStage,
  projetosCollectionPath,
} from '../lib/projetosLogic';
import type { KanbanStage, ProjetoDoc } from '../lib/projetosLogic';
import { Link, navigate } from '../lib/router';

// Tipos de domínio movidos para src/lib/projetosLogic.ts; re-export mantém
// compatibilidade com importadores existentes (ProjectWizardModal, ProjectWorkspaceTabs).
export type { KanbanStage, ChecklistItem, ProjetoDoc } from '../lib/projetosLogic';

interface VersaoDoc {
  versao: number;
  autor: string;
  resumoMudanca: string;
  conteudo: string;
}

// PRJ-R08: estágios centralizados em src/lib/projetosLogic.ts
const STAGES = KANBAN_STAGES;

export function ProjectsKanbanView() {
  const { user, notify } = useApp();
  const [projetos, setProjetos] = useState<FsDoc<ProjetoDoc>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = await fsApi.listDocs<ProjetoDoc>(projetosCollectionPath(user.id)); // PRJ-R06
      setProjetos(Array.isArray(docs) ? docs : []);
    } catch (err) {
      setProjetos([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar projetos.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    if (!user) return;
    return fsApi.subscribe(projetosCollectionPath(user.id), () => {
      void load();
    });
  }, [user?.id]);

  // PRJ-R08: estágio muda via patch no Kanban (com atualização otimista)
  const moveStage = async (projId: string, targetStage: KanbanStage) => {
    if (!user) return;
    setProjetos((prev) => applyStageMove(prev, projId, targetStage));
    try {
      await patchProjectStage(user.id, projId, targetStage);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao mover projeto.', 'err');
      void load();
    }
  };

  return (
    <AppShell
      title="Projetos Kanban"
      breadcrumb="Operação"
      primaryAction={
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Projeto (Wizard)</span>
        </button>
      }
    >
      <ProjectWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(id) => {
          void load();
          navigate(`/projetos/${id}`);
        }}
      />

      <div className="space-y-6">
        {!loading && projetos.length === 0 && (
          <div className="vy-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Nenhum projeto no pipeline ainda
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Use o assistente guiado de 4 etapas para definir canal, packaging, gancho de 30s e checklist inicial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="vy-btn-primary px-4 py-2 text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Iniciar Wizard de Projeto</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAGES.map((s) => (
              <div key={s.id} className="vy-card p-4 h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
            {STAGES.map((stage) => {
              const colItems = (Array.isArray(projetos) ? projetos : []).filter((p) => p?.data?.estagio === stage.id);
              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragId) {
                      void moveStage(dragId, stage.id);
                      setDragId(null);
                    }
                  }}
                  className="rounded-xl border p-3 space-y-3 min-h-[260px]"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="font-display font-semibold text-xs tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      {stage.label}
                    </h2>
                    <span className="font-mono-num text-xs" style={{ color: 'var(--text-muted)' }}>
                      {colItems.length}
                    </span>
                  </div>

                  {colItems.length === 0 ? (
                    <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      Sem cartões
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {colItems.map((proj) => {
                        const doneCount = (proj.data.checklist || []).filter((c) => c.feito).length;
                        const totalCheck = (proj.data.checklist || []).length;
                        return (
                          <div
                            key={proj.id}
                            draggable
                            onDragStart={() => setDragId(proj.id)}
                            className="vy-card p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing"
                          >
                            <Link
                              to={`/projetos/${proj.id}`}
                              className="text-sm font-medium leading-snug hover:underline block"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {proj.data.titulo}
                            </Link>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {proj.data.canalNome} · {proj.data.formato === 'shorts' ? 'Shorts' : 'Long'} · v{proj.data.versaoAtual || 1}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-hairline)' }}>
                              <span className="font-mono-num" style={{ color: 'var(--text-secondary)' }}>
                                {doneCount}/{totalCheck} itens
                              </span>
                              <select
                                aria-label={`Mover ${proj.data.titulo}`}
                                value={proj.data.estagio}
                                onChange={(e) => void moveStage(proj.id, e.target.value as KanbanStage)}
                                className="vy-input px-1.5 py-0.5 text-[11px]"
                              >
                                {STAGES.map((opt) => (
                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function ProjectDetailView({ id }: { id: string }) {
  const { user, notify } = useApp();
  const [proj, setProj] = useState<FsDoc<ProjetoExtendedDoc> | null>(null);
  const [versions, setVersions] = useState<FsDoc<VersaoDoc>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [doc, vers] = await Promise.all([
        fsApi.getDoc<ProjetoExtendedDoc>(`usuarios/${user.id}/projetos/${id}`),
        fsApi.listDocs<VersaoDoc>(`usuarios/${user.id}/projetos/${id}/versoes`, {
          orderBy: { field: 'versao', desc: true },
        }),
      ]);
      setProj(doc?.exists ? doc : null);
      setVersions(Array.isArray(vers) ? vers : []);
    } catch (err) {
      setProj(null);
      setVersions([]);
      notify(err instanceof Error ? err.message : 'Erro ao carregar projeto.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.id, id]);

  // PRJ-R09: exclusão física do documento, sem lixeira
  const handleDelete = async () => {
    if (!user) return;
    await deleteProjectDoc(user.id, id);
    notify('Projeto removido.', 'info');
    navigate('/projetos');
  };

  return (
    <AppShell
      title={proj?.data.titulo || 'Detalhes do Projeto'}
      breadcrumb="Projetos"
      primaryAction={
        proj ? (
          <Link to="/roteirista" className="vy-btn-primary px-3.5 py-1.5 text-xs font-medium whitespace-nowrap">
            Abrir no Roteirista IA
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/projetos" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Kanban</span>
          </Link>
          {proj && (
            <button type="button" onClick={handleDelete} className="vy-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--status-err)' }}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Projeto</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="vy-card p-8 h-64 animate-pulse" />
        ) : !proj ? (
          <div className="vy-card p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Projeto não encontrado.
          </div>
        ) : (
          <ProjectWorkspaceTabs proj={proj} versions={versions} onReload={load} />
        )}
      </div>
    </AppShell>
  );
}
