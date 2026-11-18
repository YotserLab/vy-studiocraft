import {describe, expect, it} from 'vitest';
import type {GeneratedScript} from '../lib/dataClient';
import {
  buildCapitulosFromScript,
  buildGenerateScriptPayload,
  roteiristaPerfisPath,
  roteirosCollectionPath,
  type GenerateScriptInput,
} from '../lib/roteiristaLogic';

const BASE_INPUT: GenerateScriptInput = {
  topic: 'Como estruturar roteiros com IA',
  channelName: 'Tech & Automação BR',
  niche: 'Tecnologia & Produtividade',
  audience: 'Criadores digitais',
  format: 'long',
  tone: 'Didático',
  durationMinutes: 12,
  hookStyle: 'Prova visual imediata',
  notes: '',
  profilePrompt: 'Prompt do perfil',
  fallbackProfilePrompt: 'Prompt fallback',
  partsCount: 6,
  ppm: 145,
  angle: '',
  knowledgeBase: '',
};

const SCRIPT: GeneratedScript = {
  title: 'Roteiro X',
  thumbnailIdeas: [],
  hook0to30: 'GANCHO AQUI',
  promise: 'promessa',
  chapters: [
    {heading: 'Contexto', durationHint: '00:30 – 03:00', scriptText: 'texto cap 1', visualCue: 'b-roll 1'},
    {heading: 'Virada', durationHint: '03:00 – 08:00', scriptText: 'texto cap 2', visualCue: 'b-roll 2'},
  ],
  retentionBeats: [],
  cta: 'inscreva-se',
  estimatedDurationMin: 12,
};

describe('buildGenerateScriptPayload (ROT-R01/R02/R07/R08)', () => {
  it('ROT-R01: payload inclui todos os campos exigidos pela geração', () => {
    const payload = buildGenerateScriptPayload(BASE_INPUT);
    expect(payload).toMatchObject({
      topic: 'Como estruturar roteiros com IA',
      channelName: 'Tech & Automação BR',
      niche: 'Tecnologia & Produtividade',
      audience: 'Criadores digitais',
      format: 'long',
      tone: 'Didático',
      durationMinutes: 12,
      hookStyle: 'Prova visual imediata',
    });
  });

  it('ROT-R01: topic vazio ou só espaços bloqueia a geração (retorna null)', () => {
    expect(buildGenerateScriptPayload({...BASE_INPUT, topic: ''})).toBeNull();
    expect(buildGenerateScriptPayload({...BASE_INPUT, topic: '   '})).toBeNull();
  });

  it('ROT-R02: format "shorts" é preservado', () => {
    expect(buildGenerateScriptPayload({...BASE_INPUT, format: 'shorts'})?.format).toBe('shorts');
  });

  it('ROT-R02: qualquer valor fora de "shorts" vira "long"', () => {
    expect(buildGenerateScriptPayload({...BASE_INPUT, format: 'long'})?.format).toBe('long');
    // o estado do formulário só admite long/shorts; valores inesperados caem no long
    expect(buildGenerateScriptPayload({...BASE_INPUT, format: 'live'})?.format).toBe('long');
    expect(buildGenerateScriptPayload({...BASE_INPUT, format: ''})?.format).toBe('long');
  });

  it('ROT-R07: profilePrompt informado personaliza a saída; vazio cai no prompt do perfil ativo', () => {
    expect(buildGenerateScriptPayload(BASE_INPUT)?.profilePrompt).toBe('Prompt do perfil');
    const fallback = buildGenerateScriptPayload({...BASE_INPUT, profilePrompt: ''});
    expect(fallback?.profilePrompt).toBe('Prompt fallback');
  });

  it('ROT-R07: knowledgeBase opcional é repassada ao payload', () => {
    const payload = buildGenerateScriptPayload({...BASE_INPUT, knowledgeBase: 'Fatos e fontes'});
    expect(payload?.knowledgeBase).toBe('Fatos e fontes');
  });

  it('ROT-R08: partsCount e ppm controlam divisão em partes e ritmo', () => {
    const payload = buildGenerateScriptPayload({...BASE_INPUT, partsCount: 8, ppm: 180});
    expect(payload?.partsCount).toBe(8);
    expect(payload?.ppm).toBe(180);
  });
});

describe('buildCapitulosFromScript (ROT-R03)', () => {
  it('ROT-R03: primeiro capítulo é o gancho "00 — Gancho (00:00 – 00:30)" com o texto do hook0to30', () => {
    const capitulos = buildCapitulosFromScript(SCRIPT);
    expect(capitulos[0]).toEqual({
      id: 'cap_hook',
      titulo: '00 — Gancho (00:00 – 00:30)',
      texto: 'GANCHO AQUI',
    });
  });

  it('ROT-R03: capítulos seguintes viram cap_N com heading, duração e direção visual', () => {
    const capitulos = buildCapitulosFromScript(SCRIPT);
    expect(capitulos).toHaveLength(3);
    expect(capitulos[1].id).toBe('cap_1');
    expect(capitulos[1].titulo).toBe('Contexto (00:30 – 03:00)');
    expect(capitulos[1].texto).toBe('texto cap 1\n\n[Visual / B-roll: b-roll 1]');
    expect(capitulos[2].id).toBe('cap_2');
    expect(capitulos[2].titulo).toBe('Virada (03:00 – 08:00)');
  });
});

describe('paths por usuário (ROT-R04/ROT-R05)', () => {
  it('ROT-R04: perfis de redator ficam em usuarios/{uid}/config/roteirista_perfis', () => {
    expect(roteiristaPerfisPath('u7')).toBe('usuarios/u7/config/roteirista_perfis');
  });

  it('ROT-R05: roteiros salvos ficam em usuarios/{uid}/roteiros', () => {
    expect(roteirosCollectionPath('u7')).toBe('usuarios/u7/roteiros');
  });
});
