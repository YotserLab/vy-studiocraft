// Regras de domínio de Projetos extraídas de src/views/ProjectsViews.tsx e
// src/components/ProjectWizardModal.tsx (spec: spec/dominios/projetos.yaml).
// Apenas movimentação de funções puras — sem mudança de comportamento.
import { fsApi, type FsDoc } from './dataClient';

export type KanbanStage = 'ideacao' | 'roteiro' | 'gravacao' | 'edicao' | 'publicado';

export interface ChecklistItem {
  id: string;
  texto: string;
  feito: boolean;
}

export interface ProjetoDoc {
  titulo: string;
  canalId?: string;
  canalNome: string;
  estagio: KanbanStage;
  formato: 'long' | 'shorts';
  prioridade: 'alta' | 'media' | 'baixa';
  dataPublicacaoAlvo: string;
  ctrAlvo: number;
  ganchoResumo: string;
  checklist: ChecklistItem[];
  versaoAtual: number;
}

// PRJ-R08: conjunto fechado de estágios do Kanban
export const KANBAN_STAGES: ReadonlyArray<{ id: KanbanStage; label: string }> = [
  { id: 'ideacao', label: 'Ideação' },
  { id: 'roteiro', label: 'Roteiro' },
  { id: 'gravacao', label: 'Gravação' },
  { id: 'edicao', label: 'Edição' },
  { id: 'publicado', label: 'Publicado' },
];

// PRJ-R02: wizard de criação tem 4 etapas fixas, nesta ordem
export const WIZARD_STEPS: ReadonlyArray<{ n: 1 | 2 | 3 | 4; shortLabel: string; title: string }> = [
  { n: 1, shortLabel: '1. Canal', title: 'Canal & Formato' },
  { n: 2, shortLabel: '2. Packaging', title: 'Packaging & Gancho' },
  { n: 3, shortLabel: '3. Checklist', title: 'Pipeline & Checklist' },
  { n: 4, shortLabel: '4. Revisão', title: 'Revisão Final' },
];

// PRJ-R06: projetos ficam em usuarios/{uid}/projetos (isolados por usuário)
export function projetosCollectionPath(uid: string): string {
  return `usuarios/${uid}/projetos`;
}

export interface WizardProjectInput {
  titulo: string;
  canalNome: string;
  estagio: KanbanStage;
  formato: 'long' | 'shorts';
  prioridade: 'alta' | 'media' | 'baixa';
  dataPublicacaoAlvo: string;
  ctrAlvo: string;
  conceitoThumbnail: string;
  ganchoResumo: string;
  origemRadarId: string;
  checklistItems: string[];
}

// PRJ-R01 (titulo obrigatório, canalNome default), PRJ-R03 (ctrAlvo default 8.0),
// PRJ-R04 (versaoAtual=1), PRJ-R05 (chk_N com feito=false), PRJ-R07 (origemRadarId opcional)
export function buildWizardProjectPayload(input: WizardProjectInput) {
  const titulo = input.titulo.trim();
  if (!titulo) return null; // PRJ-R01
  return {
    titulo,
    canalNome: input.canalNome.trim() || 'Canal Principal', // PRJ-R01
    estagio: input.estagio,
    formato: input.formato,
    prioridade: input.prioridade,
    dataPublicacaoAlvo: input.dataPublicacaoAlvo,
    ctrAlvo: Number.parseFloat(input.ctrAlvo) || 8.0, // PRJ-R03
    conceitoThumbnail: input.conceitoThumbnail.trim(),
    ganchoResumo: input.ganchoResumo.trim(),
    origemRadarId: input.origemRadarId || undefined, // PRJ-R07
    checklist: input.checklistItems.map((texto, idx) => ({
      id: `chk_${idx + 1}`, // PRJ-R05
      texto,
      feito: false,
    })),
    versaoAtual: 1, // PRJ-R04
  };
}

export interface VersaoInicialInput {
  autor: string;
  titulo: string;
  ganchoResumo: string;
}

// PRJ-R04: todo projeto nasce com doc versoes/v1 com autor e resumo da criação
export function buildVersaoInicialPayload(input: VersaoInicialInput) {
  return {
    versao: 1,
    autor: input.autor,
    resumoMudanca: 'Projeto criado via Wizard',
    conteudo: input.ganchoResumo.trim() || `Briefing inicial para "${input.titulo.trim()}".`,
  };
}

// PRJ-R08: atualização otimista do estágio no estado local do Kanban
export function applyStageMove(
  projetos: FsDoc<ProjetoDoc>[],
  projId: string,
  targetStage: KanbanStage
): FsDoc<ProjetoDoc>[] {
  return projetos.map((p) =>
    p.id === projId ? { ...p, data: { ...p.data, estagio: targetStage } } : p
  );
}

// PRJ-R08: mudança de estágio persiste via patch no documento do projeto
export function patchProjectStage(uid: string, projId: string, estagio: KanbanStage) {
  return fsApi.patchDoc(`usuarios/${uid}/projetos/${projId}`, { estagio });
}

// PRJ-R09: exclusão é física (DELETE do documento), sem lixeira
export function deleteProjectDoc(uid: string, projId: string) {
  return fsApi.deleteDoc(`usuarios/${uid}/projetos/${projId}`);
}
