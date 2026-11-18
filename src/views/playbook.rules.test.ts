// T24 — Regras do playbook editorial: PLY-R01, PLY-R02, PLY-R03, PLY-R04.
import { describe, expect, it } from 'vitest';
import {
  buildPlaybookDoc,
  buildPlaybookDocFromChecklist,
  parseChecklistLine,
  playbookCollectionPath,
  playbookDocPath,
} from '../lib/playbookLogic';

describe('PLY-R01 — linha do checklist vira doc de playbook', () => {
  it('PLY-R01: linha "[categoria] regra" extrai categoria e regra', () => {
    expect(parseChecklistLine('[gancho] Abrir com a promessa do vídeo')).toEqual({
      categoria: 'gancho',
      regra: 'Abrir com a promessa do vídeo',
    });
  });

  it('PLY-R01: cada linha do checklist gera um doc próprio', () => {
    const checklist = ['[gancho] Regra A', '[ritmo] Regra B'];
    const docs = checklist.map((rawLine) =>
      buildPlaybookDocFromChecklist({ rawLine, niche: 'Dev', titleA: 'A', titleB: 'B' })
    );
    expect(docs).toHaveLength(2);
    expect(docs[0].categoria).toBe('gancho');
    expect(docs[1].categoria).toBe('ritmo');
  });
});

describe('PLY-R02 — linha sem categoria cai em retencao', () => {
  it('PLY-R02: linha sem prefixo [categoria] é classificada como retencao', () => {
    expect(parseChecklistLine('Cortar qualquer pausa maior que 1s')).toEqual({
      categoria: 'retencao',
      regra: 'Cortar qualquer pausa maior que 1s',
    });
  });

  it('PLY-R02: colchete vazio no meio da frase não é prefixo de categoria', () => {
    const { categoria } = parseChecklistLine('Usar [B-roll] nos segundos 10-20');
    expect(categoria).toBe('retencao');
  });
});

describe('PLY-R03 — titulo e impacto da regra salva', () => {
  it('PLY-R03: titulo é "<CATEGORIA> — Comparativo 30s (<nicho>)"', () => {
    const doc = buildPlaybookDocFromChecklist({
      rawLine: '[gancho] Pergunta direta nos 3 primeiros segundos',
      niche: 'Finanças',
      titleA: 'Abertura A',
      titleB: 'Abertura B',
    });
    expect(doc.categoria).toBe('gancho');
    expect(doc.titulo).toBe('GANCHO — Comparativo 30s (Finanças)');
    expect(doc.regra).toBe('Pergunta direta nos 3 primeiros segundos');
  });

  it('PLY-R03: impacto cita os lados A e B da comparação', () => {
    const doc = buildPlaybookDocFromChecklist({
      rawLine: 'Mostrar resultado final logo no início',
      niche: 'Dev',
      titleA: 'Como eu faria X',
      titleB: 'Tutorial X em 30s',
    });
    expect(doc.categoria).toBe('retencao');
    expect(doc.impacto).toBe('Extraído da comparação: Como eu faria X vs Tutorial X em 30s');
  });
});

describe('PLY-R04 — isolamento por usuário', () => {
  it('PLY-R04: regras ficam em usuarios/{uid}/playbook', () => {
    expect(playbookCollectionPath('u1')).toBe('usuarios/u1/playbook');
    expect(playbookCollectionPath('u2')).toBe('usuarios/u2/playbook');
    expect(playbookDocPath('u1', 'r3')).toBe('usuarios/u1/playbook/r3');
  });
});

describe('PlaybookView — formulário manual', () => {
  it('regra manual guarda categoria, titulo, regra e impacto (default Consistência editorial)', () => {
    const doc = buildPlaybookDoc({ titulo: ' Gancho forte ', categoria: 'Primeiros 30s', regra: ' Teste ', impacto: ' ' });
    expect(doc).toEqual({
      titulo: 'Gancho forte',
      categoria: 'Primeiros 30s',
      regra: 'Teste',
      impacto: 'Consistência editorial',
    });
  });
});
