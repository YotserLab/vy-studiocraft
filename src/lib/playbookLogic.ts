// Regras de domínio do Playbook Editorial (PLY) extraídas de
// MediaAndContentViews.tsx (PlaybookView) e AiStudioViews.tsx (Compare30sView).

export type PlaybookDocData = {
  categoria: string;
  titulo: string;
  regra: string;
  impacto: string;
}

// PLY-R04 — regras ficam em usuarios/{uid}/playbook, isoladas por usuário (PLA-R04).
export function playbookCollectionPath(uid: string): string {
  return `usuarios/${uid}/playbook`;
}

export function playbookDocPath(uid: string, regraId: string): string {
  return `${playbookCollectionPath(uid)}/${regraId}`;
}

// PLY-R01 + PLY-R02 — cada linha '[categoria] regra' do checklist de uma
// comparação 30s vira um doc de playbook; linha sem prefixo '[categoria]'
// é classificada como 'retencao'.
export function parseChecklistLine(rawLine: string): { categoria: string; regra: string } {
  const match = rawLine.trim().match(/^\[([^\]]+)\]\s*(.+)$/);
  const categoria = match ? match[1].trim() : 'retencao';
  const regra = match ? match[2].trim() : rawLine.trim();
  return { categoria, regra };
}

// PLY-R03 — regra salva guarda titulo '<CATEGORIA> — Comparativo 30s (<nicho>)'
// e impacto citando os lados A e B da comparação.
export interface ChecklistPlaybookInput {
  rawLine: string;
  niche: string;
  titleA: string;
  titleB: string;
}

export function buildPlaybookDocFromChecklist(input: ChecklistPlaybookInput): PlaybookDocData {
  const { categoria, regra } = parseChecklistLine(input.rawLine);
  return {
    categoria,
    titulo: `${categoria.toUpperCase()} — Comparativo 30s (${input.niche})`,
    regra,
    impacto: `Extraído da comparação: ${input.titleA} vs ${input.titleB}`,
  };
}

// Doc do formulário manual do /playbook: impacto em branco assume
// 'Consistência editorial' (default da view).
export interface NovaRegraPlaybookInput {
  titulo: string;
  categoria: string;
  regra: string;
  impacto: string;
}

export function buildPlaybookDoc(input: NovaRegraPlaybookInput): PlaybookDocData {
  return {
    titulo: input.titulo.trim(),
    categoria: input.categoria,
    regra: input.regra.trim(),
    impacto: input.impacto.trim() || 'Consistência editorial',
  };
}
