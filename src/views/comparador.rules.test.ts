import {describe, expect, it} from 'vitest';
import type {Comparison30sResult} from '../lib/dataClient';
import {
  buildCompareRequest,
  buildComparisonDoc,
  comparacoesCollectionPath,
  comparisonWinnerLabel,
  type CompareInput,
} from '../lib/comparadorLogic';

const BASE_INPUT: CompareInput = {
  niche: 'Tecnologia & Produtividade',
  titleA: 'Opção A — Prova Direta',
  hookA: 'Hook falado A',
  visualCutsA: 'Cortes A',
  titleB: 'Opção B — Pergunta Aberta',
  hookB: 'Hook falado B',
  visualCutsB: 'Cortes B',
};

const RESULT: Comparison30sResult = {
  winner: 'A',
  summary: 'resumo',
  criteria: [{name: 'Clareza', assessmentA: 'ok', assessmentB: 'ok', edge: 'A'}],
  improvedHookA: 'a+',
  improvedHookB: 'b+',
  actionChecklist: [],
};

describe('buildCompareRequest (CMP-R01)', () => {
  it('CMP-R01: payload inclui os 7 campos exigidos da comparação', () => {
    const req = buildCompareRequest(BASE_INPUT);
    expect(req).toEqual({
      niche: 'Tecnologia & Produtividade',
      titleA: 'Opção A — Prova Direta',
      hookA: 'Hook falado A',
      visualCutsA: 'Cortes A',
      titleB: 'Opção B — Pergunta Aberta',
      hookB: 'Hook falado B',
      visualCutsB: 'Cortes B',
    });
  });

  it('CMP-R01: hookA vazio/em branco bloqueia a comparação (retorna null)', () => {
    expect(buildCompareRequest({...BASE_INPUT, hookA: ''})).toBeNull();
    expect(buildCompareRequest({...BASE_INPUT, hookA: '   '})).toBeNull();
  });

  it('CMP-R01: hookB vazio/em branco bloqueia a comparação (retorna null)', () => {
    expect(buildCompareRequest({...BASE_INPUT, hookB: ''})).toBeNull();
    expect(buildCompareRequest({...BASE_INPUT, hookB: '   '})).toBeNull();
  });

  it('CMP-R01: gate atual valida só os ganchos — demais campos passam mesmo vazios (comportamento existente)', () => {
    const req = buildCompareRequest({...BASE_INPUT, niche: '', titleA: '', visualCutsA: '', titleB: '', visualCutsB: ''});
    expect(req).not.toBeNull();
    expect(req?.niche).toBe('');
    expect(req?.titleA).toBe('');
  });
});

describe('comparisonWinnerLabel (CMP-R02)', () => {
  it('CMP-R02: winner "A" ou "B" declara vantagem para a opção', () => {
    expect(comparisonWinnerLabel('A')).toBe('Vantagem para Opção A');
    expect(comparisonWinnerLabel('B')).toBe('Vantagem para Opção B');
  });

  it('CMP-R02: winner "empate" vira "Empate Técnico"', () => {
    expect(comparisonWinnerLabel('empate')).toBe('Empate Técnico');
  });
});

describe('persistência da comparação (CMP-R03)', () => {
  it('CMP-R03: comparações salvas ficam em usuarios/{uid}/comparacoes', () => {
    expect(comparacoesCollectionPath('u5')).toBe('usuarios/u5/comparacoes');
  });

  it('CMP-R03: documento salvo guarda inputs + resultado com winner/edge', () => {
    const docData = buildComparisonDoc(BASE_INPUT, RESULT);
    expect(docData).toMatchObject({
      niche: BASE_INPUT.niche,
      titleA: BASE_INPUT.titleA,
      hookA: BASE_INPUT.hookA,
      visualCutsA: BASE_INPUT.visualCutsA,
      titleB: BASE_INPUT.titleB,
      hookB: BASE_INPUT.hookB,
      visualCutsB: BASE_INPUT.visualCutsB,
    });
    expect(docData.result.winner).toBe('A');
    expect(docData.result.criteria[0].edge).toBe('A');
  });
});
