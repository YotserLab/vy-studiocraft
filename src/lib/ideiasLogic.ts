// Regras de domínio de Ideias (IDE) extraídas de ChannelsViews.tsx (ExploreView)
// e NewsAndSystemViews.tsx (NewsView -> "Salvar como Ideia").

// IDE-R05 — /explorar é a visão de ideias do usuário.
export const IDEIAS_ROUTE = '/explorar';

export type IdeiaDocData = {
  titulo: string;
  nicho: string;
  potencial: string;
  origem: string;
  notas: string;
}

// IDE-R02 — ideias ficam em usuarios/{uid}/ideias, isoladas por usuário (PLA-R04).
export function ideiasCollectionPath(uid: string): string {
  return `usuarios/${uid}/ideias`;
}

export function ideiaDocPath(uid: string, ideiaId: string): string {
  return `${ideiasCollectionPath(uid)}/${ideiaId}`;
}

// IDE-R01 — título não vazio é exigido para registrar a ideia.
export function isIdeiaTituloValido(titulo: string): boolean {
  return titulo.trim().length > 0;
}

// IDE-R01 — ideia registra titulo, nicho, potencial, origem e notas.
// Defaults do formulário do /explorar: nicho 'Geral', potencial 'alto', origem 'Explorar'.
export interface NovaIdeiaInput {
  titulo: string;
  nicho: string;
  notas: string;
}

export function buildIdeiaDoc(input: NovaIdeiaInput): IdeiaDocData {
  return {
    titulo: input.titulo.trim(),
    nicho: input.nicho.trim() || 'Geral',
    potencial: 'alto',
    origem: 'Explorar',
    notas: input.notas.trim(),
  };
}

// IDE-R03 — notícia convertida vira ideia com titulo 'Pauta Notícia: <título>',
// origem 'Notícias RSS' e potencial 'alto'.
export interface NoticiaIdeiaInput {
  title: string;
  summary: string;
  link: string;
  channelTitle: string;
}

export function buildNoticiaIdeiaDoc(input: NoticiaIdeiaInput): IdeiaDocData {
  return {
    titulo: `Pauta Notícia: ${input.title}`,
    nicho: input.channelTitle || 'Mercado',
    potencial: 'alto',
    origem: 'Notícias RSS',
    notas: `${input.summary}\nFonte: ${input.link}`,
  };
}
