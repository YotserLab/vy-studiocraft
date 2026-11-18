// T22 — Regras de ideias: IDE-R01, IDE-R02, // NOT-R05: mesma conversão notícia->ideias
// T22 — Regras de ideias: IDE-R01, IDE-R02, IDE-R03, IDE-R05.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildIdeiaDoc,
  buildNoticiaIdeiaDoc,
  IDEIAS_ROUTE,
  ideiaDocPath,
  ideiasCollectionPath,
  isIdeiaTituloValido,
} from '../lib/ideiasLogic';
import type { FsDoc } from '../lib/dataClient';
import { ExploreView } from './ChannelsViews';

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
});

interface IdeiaData {
  titulo: string;
  nicho: string;
  potencial: string;
  origem: string;
  notas: string;
}

function ideiaFsDoc(id: string, data: IdeiaData): FsDoc<IdeiaData> {
  return {
    exists: true,
    id,
    path: `usuarios/u1/ideias/${id}`,
    coll: 'ideias',
    parent: 'usuarios/u1',
    uid: 'u1',
    createdAt: 0,
    updatedAt: 0,
    data,
  };
}

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

describe('IDE-R01 — campos da ideia', () => {
  it('IDE-R01: ideia registra titulo, nicho, potencial, origem e notas', () => {
    const doc = buildIdeiaDoc({ titulo: ' Vídeo sobre IA ', nicho: ' Tutoriais ', notas: ' ângulo X ' });
    expect(doc).toEqual({
      titulo: 'Vídeo sobre IA',
      nicho: 'Tutoriais',
      potencial: 'alto',
      origem: 'Explorar',
      notas: 'ângulo X',
    });
  });

  it('IDE-R01: nicho em branco assume Geral', () => {
    expect(buildIdeiaDoc({ titulo: 'T', nicho: '  ', notas: '' }).nicho).toBe('Geral');
  });

  it('IDE-R01: título vazio ou só espaços não é válido para salvar', () => {
    expect(isIdeiaTituloValido('')).toBe(false);
    expect(isIdeiaTituloValido('   ')).toBe(false);
    expect(isIdeiaTituloValido('Pauta')).toBe(true);
  });
});

describe('IDE-R02 — isolamento por usuário', () => {
  it('IDE-R02: ideias ficam em usuarios/{uid}/ideias', () => {
    expect(ideiasCollectionPath('u1')).toBe('usuarios/u1/ideias');
    expect(ideiasCollectionPath('u2')).toBe('usuarios/u2/ideias');
    expect(ideiaDocPath('u1', 'i7')).toBe('usuarios/u1/ideias/i7');
  });
});

describe('IDE-R03 — notícia convertida em ideia', () => {
  it('IDE-R03: vira ideia com titulo "Pauta Notícia: <título>", origem Notícias RSS e potencial alto', () => {
    const doc = buildNoticiaIdeiaDoc({
      title: 'YouTube muda algoritmo',
      summary: 'Resumo da notícia',
      link: 'https://exemplo.com/n1',
      channelTitle: 'The Verge',
    });
    expect(doc).toEqual({
      titulo: 'Pauta Notícia: YouTube muda algoritmo',
      nicho: 'The Verge',
      potencial: 'alto',
      origem: 'Notícias RSS',
      notas: 'Resumo da notícia\nFonte: https://exemplo.com/n1',
    });
  });

  it('IDE-R03: notícia sem título usa "Sem título" do parser e canal vazio assume Mercado', () => {
    const doc = buildNoticiaIdeiaDoc({ title: 'Sem título', summary: '', link: 'https://x', channelTitle: '' });
    expect(doc.titulo).toBe('Pauta Notícia: Sem título');
    expect(doc.nicho).toBe('Mercado');
    expect(doc.origem).toBe('Notícias RSS');
    expect(doc.potencial).toBe('alto');
  });
});

describe('IDE-R05 — /explorar é a visão de ideias', () => {
  it('IDE-R05: rota da visão de ideias é /explorar', () => {
    expect(IDEIAS_ROUTE).toBe('/explorar');
  });

  it('IDE-R05: ExploreView carrega ideias de usuarios/{uid}/ideias e exibe os títulos', async () => {
    docsByColl = {
      ideias: [
        ideiaFsDoc('i1', { titulo: 'Review do novo iPhone', nicho: 'Tech', potencial: 'alto', origem: 'Explorar', notas: '' }),
        ideiaFsDoc('i2', { titulo: 'Pauta Notícia: Shorts paga mais', nicho: 'Mercado', potencial: 'alto', origem: 'Notícias RSS', notas: 'Fonte' }),
      ],
    };
    const rendered = await renderView(createElement(ExploreView));
    try {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.startsWith('/api/v1/fs/usuarios/u1/ideias'))).toBe(true);
      const text = rendered.container.textContent || '';
      expect(text).toContain('Explorar Ideias');
      expect(text).toContain('Review do novo iPhone');
      expect(text).toContain('Pauta Notícia: Shorts paga mais');
      expect(text).toContain('Origem: Notícias RSS');
    } finally {
      await unmountView(rendered);
    }
  });
});
