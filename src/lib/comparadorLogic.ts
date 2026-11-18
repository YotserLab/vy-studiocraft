// Regras de domínio do Comparador 30s extraídas de src/views/AiStudioViews.tsx
// (spec: spec/dominios/comparador.yaml). Movimentação de funções puras —
// sem mudança de comportamento.
import type { Comparison30sResult } from './dataClient';

// CMP-R03: comparações salvas ficam em usuarios/{uid}/comparacoes
export function comparacoesCollectionPath(uid: string): string {
  return `usuarios/${uid}/comparacoes`;
}

export interface CompareInput {
  niche: string;
  titleA: string;
  hookA: string;
  visualCutsA: string;
  titleB: string;
  hookB: string;
  visualCutsB: string;
}

// CMP-R01: o gate do submit exige os dois ganchos (hookA e hookB) preenchidos;
// os demais campos são enviados como vieram do formulário.
export function buildCompareRequest(input: CompareInput): CompareInput | null {
  if (!input.hookA.trim() || !input.hookB.trim()) return null;
  return {
    niche: input.niche,
    titleA: input.titleA,
    hookA: input.hookA,
    visualCutsA: input.visualCutsA,
    titleB: input.titleB,
    hookB: input.hookB,
    visualCutsB: input.visualCutsB,
  };
}

// CMP-R03: documento salvo junta os inputs da comparação com o resultado da IA
export function buildComparisonDoc(input: CompareInput, result: Comparison30sResult) {
  return {
    niche: input.niche,
    titleA: input.titleA,
    hookA: input.hookA,
    visualCutsA: input.visualCutsA,
    titleB: input.titleB,
    hookB: input.hookB,
    visualCutsB: input.visualCutsB,
    result,
  };
}

// CMP-R02: winner ∈ {A, B, empate}; 'empate' vira "Empate Técnico" no diagnóstico
export function comparisonWinnerLabel(winner: Comparison30sResult['winner']): string {
  return winner === 'empate' ? 'Empate Técnico' : `Vantagem para Opção ${winner}`;
}
