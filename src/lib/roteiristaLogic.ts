// Regras de domínio do Roteirista extraídas de src/views/AiStudioViews.tsx
// (spec: spec/dominios/roteirista.yaml). Movimentação de funções puras —
// sem mudança de comportamento.
import type { GeneratedScript } from './dataClient';

// ROT-R04: perfis de redator ficam em usuarios/{uid}/config/roteirista_perfis
export function roteiristaPerfisPath(uid: string): string {
  return `usuarios/${uid}/config/roteirista_perfis`;
}

// ROT-R05: roteiros salvos ficam em usuarios/{uid}/roteiros (isolados por usuário)
export function roteirosCollectionPath(uid: string): string {
  return `usuarios/${uid}/roteiros`;
}

export interface GenerateScriptInput {
  topic: string;
  channelName: string;
  niche: string;
  audience: string;
  format: string;
  tone: string;
  durationMinutes: number;
  hookStyle: string;
  notes?: string;
  profilePrompt?: string;
  fallbackProfilePrompt?: string;
  partsCount?: number;
  ppm?: number;
  angle?: string;
  knowledgeBase?: string;
}

export type GenerateScriptPayload = {
  topic: string;
  channelName: string;
  niche: string;
  audience: string;
  format: 'long' | 'shorts';
  tone: string;
  durationMinutes: number;
  hookStyle: string;
  notes?: string;
  profilePrompt?: string;
  partsCount?: number;
  ppm?: number;
  angle?: string;
  knowledgeBase?: string;
};

// ROT-R01 (campos exigidos — topic é o gate do submit), ROT-R02 (format ∈
// {long, shorts}), ROT-R07 (profilePrompt/knowledgeBase opcionais),
// ROT-R08 (partsCount e ppm controlam partes e ritmo)
export function buildGenerateScriptPayload(input: GenerateScriptInput): GenerateScriptPayload | null {
  if (!input.topic.trim()) return null; // ROT-R01
  return {
    topic: input.topic,
    channelName: input.channelName,
    niche: input.niche,
    audience: input.audience,
    format: input.format === 'shorts' ? 'shorts' : 'long', // ROT-R02
    tone: input.tone,
    durationMinutes: input.durationMinutes,
    hookStyle: input.hookStyle,
    notes: input.notes,
    profilePrompt: input.profilePrompt || input.fallbackProfilePrompt, // ROT-R07
    partsCount: input.partsCount, // ROT-R08
    ppm: input.ppm, // ROT-R08
    angle: input.angle,
    knowledgeBase: input.knowledgeBase, // ROT-R07
  };
}

export interface CapituloProjeto {
  id: string;
  titulo: string;
  texto: string;
}

// ROT-R03: roteiro enviado ao Kanban abre com o capítulo de gancho
// '00 — Gancho (00:00 – 00:30)', seguido dos capítulos com direção visual.
export function buildCapitulosFromScript(script: GeneratedScript): CapituloProjeto[] {
  return [
    {
      id: 'cap_hook',
      titulo: '00 — Gancho (00:00 – 00:30)',
      texto: script.hook0to30,
    },
    ...script.chapters.map((ch, idx) => ({
      id: `cap_${idx + 1}`,
      titulo: `${ch.heading} (${ch.durationHint})`,
      texto: `${ch.scriptText}\n\n[Visual / B-roll: ${ch.visualCue}]`,
    })),
  ];
}
