// Regras de domínio da Pesquisa Global (PES) extraídas de
// ChannelsViews.tsx (GlobalSearchView).
import type { FsDoc } from './dataClient';

export interface ResultadoPesquisa {
  tipo: string;
  titulo: string;
  subtitulo: string;
  to: string;
}

// PES-R01 — busca cobre 4 coleções: projetos, canais, notas e radar_perfis
// do usuário.
export function pesquisaCollectionPaths(uid: string): {
  projetos: string;
  canais: string;
  notas: string;
  radar: string;
} {
  return {
    projetos: `usuarios/${uid}/projetos`,
    canais: `usuarios/${uid}/canais`,
    notas: `usuarios/${uid}/notas`,
    radar: `usuarios/${uid}/radar_perfis`,
  };
}

interface ProjetoSearchDoc {
  titulo?: string;
  canalNome?: string;
  estagio?: string;
}

interface NomeNichoDoc {
  nome?: string;
  nicho?: string;
}

interface NotaSearchDoc {
  titulo?: string;
  categoria?: string;
}

// PES-R02 — cada resultado leva tipo (Projeto|Canal|Nota|Radar), titulo,
// subtitulo e link para a rota da entidade.
export function buildResultadosPesquisa(input: {
  projetos: FsDoc<ProjetoSearchDoc>[];
  canais: FsDoc<NomeNichoDoc>[];
  notas: FsDoc<NotaSearchDoc>[];
  radar: FsDoc<NomeNichoDoc>[];
}): ResultadoPesquisa[] {
  const { projetos, canais, notas, radar } = input;
  return [
    ...(Array.isArray(projetos) ? projetos : []).map((d) => ({
      tipo: 'Projeto',
      titulo: d.data?.titulo || '',
      subtitulo: `${d.data?.canalNome || ''} · ${d.data?.estagio || ''}`,
      to: `/projetos/${d.id}`,
    })),
    ...(Array.isArray(canais) ? canais : []).map((d) => ({
      tipo: 'Canal',
      titulo: d.data?.nome || '',
      subtitulo: d.data?.nicho || '',
      to: `/canais/${d.id}`,
    })),
    ...(Array.isArray(notas) ? notas : []).map((d) => ({
      tipo: 'Nota',
      titulo: d.data?.titulo || '',
      subtitulo: d.data?.categoria || '',
      to: '/notas',
    })),
    ...(Array.isArray(radar) ? radar : []).map((d) => ({
      tipo: 'Radar',
      titulo: d.data?.nome || '',
      subtitulo: d.data?.nicho || '',
      to: `/radar/perfis/${d.id}`,
    })),
  ];
}

// PES-R03 — filtro case-insensitive que casa titulo, subtitulo ou tipo.
// PES-R05 — query vazia (ou só espaços) lista todos os itens.
export function filterResultadosPesquisa(results: ResultadoPesquisa[], query: string): ResultadoPesquisa[] {
  const list = Array.isArray(results) ? results : [];
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter(
    (r) =>
      r.titulo?.toLowerCase().includes(q) ||
      r.subtitulo?.toLowerCase().includes(q) ||
      r.tipo.toLowerCase().includes(q)
  );
}

// PES-R04 — query string ?q= sincroniza o termo da busca com a URL (NAV-R09).
export function queryFromSearchParams(searchParams: URLSearchParams): string {
  return searchParams.get('q') || '';
}
