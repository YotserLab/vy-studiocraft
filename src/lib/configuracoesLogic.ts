// Regras de domínio de Configurações (CFG) extraídas de AppContext.tsx.
// TEMAS/TemaId moram aqui para evitar ciclo de import context<->lib;
// AppContext re-exporta ambos para manter os imports existentes.

export type TemaId = 'claro' | 'azul' | 'escuro' | 'roxo' | 'tecnologico' | 'youtube';

export const TEMAS: Array<{ id: TemaId; label: string; desc: string; swatch: string; accent: string }> = [
  { id: 'claro', label: 'Claro (Adminator)', desc: 'Painel editorial claro padrão', swatch: '#f0f4f8', accent: '#2563eb' },
  { id: 'azul', label: 'Azul Clássico', desc: 'Ardósia azulada noturna', swatch: '#0b1324', accent: '#3b82f6' },
  { id: 'escuro', label: 'Escuro', desc: 'Grafite neutro de alto foco', swatch: '#0f1115', accent: '#3b82f6' },
  { id: 'roxo', label: 'Roxo', desc: 'Estúdio violeta noturno', swatch: '#120f1d', accent: '#8b5cf6' },
  { id: 'tecnologico', label: 'Tecnológico', desc: 'Ardósia fria com ciano', swatch: '#091318', accent: '#0891b2' },
  { id: 'youtube', label: 'YouTube', desc: 'Preto editorial com acento vermelho', swatch: '#0f0f0f', accent: '#dc2626' },
];

// CFG-R03 — sem login ou sem doc, o tema vem do localStorage 'vysc_tema'.
export const TEMA_STORAGE_KEY = 'vysc_tema';

// CFG-R02 — tema só é aplicado se existir no registro TEMAS.
export function isTemaIdValido(value: string | null | undefined): value is TemaId {
  return Boolean(value) && TEMAS.some((t) => t.id === value);
}

// CFG-R02 + CFG-R03 — valor inválido (ou ausente) cai para 'claro'.
export function resolveStoredTema(saved: string | null): TemaId {
  return saved && isTemaIdValido(saved) ? saved : 'claro';
}

// CFG-R03 — leitura resiliente da preferência local.
export function temaFromLocalStorage(storage: Pick<Storage, 'getItem'> = localStorage): TemaId {
  try {
    return resolveStoredTema(storage.getItem(TEMA_STORAGE_KEY));
  } catch {
    return 'claro';
  }
}

// CFG-R02 + CFG-R04 — tema do doc remoto só sobrescreve o local quando válido;
// retorna null quando o doc não traz um tema aplicável (mantém o local).
export function resolveRemoteTema(remote: string | null | undefined): TemaId | null {
  return isTemaIdValido(remote) ? remote : null;
}

// CFG-R01 — tema do usuário é gravado em usuarios/{uid}/config/app no campo tema.
export function configAppDocPath(uid: string): string {
  return `usuarios/${uid}/config/app`;
}
