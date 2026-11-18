// Regras de domínio de Notas (NTA) extraídas de MediaAndContentViews.tsx (NotesView).
import { fsApi } from './dataClient';

export type NotaDocData = {
  titulo: string;
  categoria: string;
  conteudo: string;
  fixada: boolean;
}

// NTA-R03 — notas ficam em usuarios/{uid}/notas, isoladas por usuário (PLA-R04).
export function notasCollectionPath(uid: string): string {
  return `usuarios/${uid}/notas`;
}

export function notaDocPath(uid: string, notaId: string): string {
  return `${notasCollectionPath(uid)}/${notaId}`;
}

// NTA-R01 — nota exige titulo não vazio para ser salva.
export function isNotaTituloValido(titulo: string): boolean {
  return titulo.trim().length > 0;
}

// NTA-R02 — nota nasce com fixada=false.
export interface NovaNotaInput {
  titulo: string;
  categoria: string;
  conteudo: string;
}

export function buildNotaDoc(input: NovaNotaInput): NotaDocData {
  return {
    titulo: input.titulo.trim(),
    categoria: input.categoria,
    conteudo: input.conteudo.trim(),
    fixada: false,
  };
}

// NTA-R04 — exclusão de nota é física: DELETE do documento, sem lixeira.
export async function deleteNota(uid: string, notaId: string): Promise<{ ok: boolean; path: string }> {
  return fsApi.deleteDoc(notaDocPath(uid, notaId));
}
