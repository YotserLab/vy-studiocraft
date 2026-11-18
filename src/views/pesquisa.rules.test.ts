// T26 — Regras da pesquisa global: PES-R01, PES-R02, PES-R03, PES-R04, PES-R05.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildResultadosPesquisa,
  filterResultadosPesquisa,
  pesquisaCollectionPaths,
  queryFromSearchParams,
  type ResultadoPesquisa,
} from '../lib/pesquisaLogic';
import type { FsDoc } from '../lib/dataClient';
import { GlobalSearchView } from './ChannelsViews';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const app = vi.hoisted(() => ({
  user: {
    id: 'u1',
    email: 'criadora@exemplo.com',
    displayName: 'Criadora',
    emailVerified: true,
    isAdmin: false,
    mfaEnabled: false,
    createdAt: 0,
    updatedAt: 0,
  },
  notify: vi.fn(),
}));

vi.mock('../contexts/AppContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/AppContext')>();
  return {
    ...actual,
    useApp: () => ({
      user: app.user,
      authLoading: false,
      runtimeConfig: null,
      tema: 'claro' as const,
      setTema: async () => undefined,
      refreshAuth: async () => undefined,
      setUserDirect: () => undefined,
      logout: async () => undefined,
      notify: app.notify,
    }),
  };
});

function okJson(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

let docsByColl: Record<string, unknown[]> = {};
const fetchMock = vi.fn(async (input: unknown): Promise<Response> => {
  const url = String(input);
  for (const coll of Object.keys(docsByColl)) {
    if (url.includes(`/api/v1/fs/usuarios/u1/${coll}`)) return okJson({ docs: docsByColl[coll] });
  }
  return okJson({ docs: [] });
});
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  docsByColl = {};
  fetchMock.mockClear();
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/pesquisa');
});

function fsDoc<T>(id: string, coll: string, data: T): FsDoc<T> {
  return {
    exists: true,
    id,
    path: `usuarios/u1/${coll}/${id}`,
    coll,
    parent: 'usuarios/u1',
    uid: 'u1',
    createdAt: 0,
    updatedAt: 0,
    data,
  };
}

const RESULTADOS: ResultadoPesquisa[] = [
  { tipo: 'Projeto', titulo: 'Como fazer video viral', subtitulo: 'Canal Tech · edicao', to: '/projetos/p1' },
  { tipo: 'Canal', titulo: 'Canal Tech BR', subtitulo: 'Dev', to: '/canais/c1' },
  { tipo: 'Nota', titulo: 'Checklist SEO', subtitulo: 'Editorial', to: '/notas' },
  { tipo: 'Radar', titulo: 'techreviews', subtitulo: 'Reviews', to: '/radar/perfis/r1' },
];

interface Rendered {
  container: HTMLDivElement;
  root: Root;
}

async function renderView(element: ReactElement): Promise<Rendered> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

async function unmountView({ container, root }: Rendered): Promise<void> {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

describe('PES-R01 — cobertura das 4 coleções', () => {
  it('PES-R01: busca cobre projetos, canais, notas e radar_perfis do usuário', () => {
    const paths = pesquisaCollectionPaths('u1');
    expect(paths).toEqual({
      projetos: 'usuarios/u1/projetos',
      canais: 'usuarios/u1/canais',
      notas: 'usuarios/u1/notas',
      radar: 'usuarios/u1/radar_perfis',
    });
  });

  it('PES-R01: a view consulta as 4 coleções ao carregar', async () => {
    docsByColl = { projetos: [], canais: [], notas: [], radar_perfis: [] };
    const rendered = await renderView(createElement(GlobalSearchView));
    try {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      for (const coll of ['projetos', 'canais', 'notas', 'radar_perfis']) {
        expect(urls.some((u) => u.includes(`/api/v1/fs/usuarios/u1/${coll}`))).toBe(true);
      }
    } finally {
      await unmountView(rendered);
    }
  });
});

describe('PES-R02 — formato do resultado', () => {
  it('PES-R02: cada resultado leva tipo, titulo, subtitulo e link da entidade', () => {
    const results = buildResultadosPesquisa({
      projetos: [fsDoc('p1', 'projetos', { titulo: 'Vídeo A', canalNome: 'Canal X', estagio: 'edicao' })],
      canais: [fsDoc('c1', 'canais', { nome: 'Canal X', nicho: 'Dev' })],
      notas: [fsDoc('n1', 'notas', { titulo: 'Nota Y', categoria: 'Editorial' })],
      radar: [fsDoc('r1', 'radar_perfis', { nome: 'Perfil Z', nicho: 'Games' })],
    });
    expect(results).toEqual([
      { tipo: 'Projeto', titulo: 'Vídeo A', subtitulo: 'Canal X · edicao', to: '/projetos/p1' },
      { tipo: 'Canal', titulo: 'Canal X', subtitulo: 'Dev', to: '/canais/c1' },
      { tipo: 'Nota', titulo: 'Nota Y', subtitulo: 'Editorial', to: '/notas' },
      { tipo: 'Radar', titulo: 'Perfil Z', subtitulo: 'Games', to: '/radar/perfis/r1' },
    ]);
  });
});

describe('PES-R03 — filtro case-insensitive', () => {
  it('PES-R03: casa por titulo ignorando maiúsculas', () => {
    const out = filterResultadosPesquisa(RESULTADOS, 'VIRAL');
    expect(out).toHaveLength(1);
    expect(out[0].tipo).toBe('Projeto');
  });

  it('PES-R03: casa por subtitulo', () => {
    const out = filterResultadosPesquisa(RESULTADOS, 'editorial');
    expect(out.map((r) => r.tipo)).toEqual(['Nota']);
  });

  it('PES-R03: casa por tipo', () => {
    const out = filterResultadosPesquisa(RESULTADOS, 'radar');
    expect(out.map((r) => r.tipo)).toEqual(['Radar']);
  });

  it('PES-R03: termo sem correspondência esvazia a lista', () => {
    expect(filterResultadosPesquisa(RESULTADOS, 'zzzz')).toHaveLength(0);
  });
});

describe('PES-R04 — sincronização com ?q=', () => {
  it('PES-R04: termo inicial vem da query string ?q=', () => {
    expect(queryFromSearchParams(new URLSearchParams('?q=video'))).toBe('video');
    expect(queryFromSearchParams(new URLSearchParams('?q=gancho+30s'))).toBe('gancho 30s');
    expect(queryFromSearchParams(new URLSearchParams(''))).toBe('');
    expect(queryFromSearchParams(new URLSearchParams('?outro=1'))).toBe('');
  });

  it('PES-R04: GlobalSearchView inicializa o campo com o valor de ?q= da URL', async () => {
    window.history.replaceState({}, '', '/pesquisa?q=video');
    docsByColl = {
      projetos: [fsDoc('p1', 'projetos', { titulo: 'Como fazer video viral', canalNome: 'Canal Tech', estagio: 'edicao' })],
      canais: [fsDoc('c1', 'canais', { nome: 'Canal Tech BR', nicho: 'Dev' })],
      notas: [],
      radar_perfis: [],
    };
    const rendered = await renderView(createElement(GlobalSearchView));
    try {
      const input = rendered.container.querySelector(
        'input[placeholder="Pesquisar em projetos, canais, notas e perfis do Radar..."]'
      ) as HTMLInputElement | null;
      expect(input).not.toBeNull();
      expect(input!.value).toBe('video');
      const text = rendered.container.textContent || '';
      expect(text).toContain('Como fazer video viral');
      expect(text).not.toContain('Canal Tech BR');
    } finally {
      await unmountView(rendered);
    }
  });
});

describe('PES-R05 — busca vazia lista tudo', () => {
  it('PES-R05: query vazia retorna todos os itens das 4 coleções', () => {
    expect(filterResultadosPesquisa(RESULTADOS, '')).toHaveLength(4);
    expect(filterResultadosPesquisa(RESULTADOS, '   ')).toHaveLength(4);
  });
});
