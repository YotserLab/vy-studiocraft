// Regras de domínio de Mídia (MID) extraídas de MediaAndContentViews.tsx
// (SavedVideosView).

export type VideoSalvoDocData = {
  titulo: string;
  tituloPt?: string;
  canal: string;
  url: string;
  duracao: string;
  motivoSalvo: string;
  categoria: string;
}

// Coleção de vídeos salvos do usuário (mesma isolação de PLA-R04).
export function videosSalvosCollectionPath(uid: string): string {
  return `usuarios/${uid}/videos_salvos`;
}

export function videoSalvoDocPath(uid: string, videoId: string): string {
  return `${videosSalvosCollectionPath(uid)}/${videoId}`;
}

// MID-R06 — vídeo salvo exige titulo não vazio.
export function isVideoSalvoTituloValido(titulo: string): boolean {
  return titulo.trim().length > 0;
}

// MID-R06 — canal em branco assume 'Referência'; demais defaults da view
// (url fallback, duracao '10:00', categoria 'Referência').
export interface NovoVideoSalvoInput {
  titulo: string;
  canal: string;
  url: string;
  motivoSalvo: string;
}

export function buildVideoSalvoDoc(input: NovoVideoSalvoInput): VideoSalvoDocData {
  return {
    titulo: input.titulo.trim(),
    canal: input.canal.trim() || 'Referência',
    url: input.url.trim() || 'https://www.youtube.com',
    duracao: '10:00',
    motivoSalvo: input.motivoSalvo.trim(),
    categoria: 'Referência',
  };
}
