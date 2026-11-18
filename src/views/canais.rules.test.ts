// T21 — Regras de canais: CAN-R01, CAN-R02, CAN-R03, CAN-R05.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCanalDoc,
  CANAIS_ROUTE,
  canalDetailRoute,
  canalDocPath,
  canaisCollectionPath,
  filterCanaisVisiveis,
  isTipoCanalValido,
} from '../lib/canaisLogic';
import type { FsDoc } from '../lib/dataClient';
import { ChannelsListView, type CanalDoc } from './ChannelsViews';

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

function canalDoc(id: string, data: Partial<CanalDoc> & { nome: string; tipo: 'proprio' | 'referencia' }): FsDoc<CanalDoc> {
  return {
    exists: true,
    id,
    path: `usuarios/u1/canais/${id}`,
    coll: 'canais',
    parent: 'usuarios/u1',
    uid: 'u1',
    createdAt: 0,
    updatedAt: 0,
    data: {
      handle: '@handle',
      nicho: 'Dev',
      inscritos: 0,
      views30d: 0,
      ctrMedio: 0,
      retencaoMedia: 0,
      frequenciaSemanal: 0,
      descricao: '',
      ...data,
    },
  };
}

const CANAL_PROPRIO = canalDoc('c1', {
  nome: 'Canal Tech BR',
  tipo: 'proprio',
  inscritos: 12345,
  views30d: 90000,
  ctrMedio: 6.5,
  retencaoMedia: 52.5,
});
const CANAL_REF = canalDoc('c2', { nome: 'Canal Referência', tipo: 'referencia', inscritos: 999 });

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

describe('CAN-R01 — tipo do canal e filtro da visão', () => {
  it('CAN-R01: canal tem tipo proprio ou referencia', () => {
    expect(isTipoCanalValido('proprio')).toBe(true);
    expect(isTipoCanalValido('referencia')).toBe(true);
    expect(isTipoCanalValido('outro')).toBe(false);
    expect(isTipoCanalValido('')).toBe(false);
  });

  it('CAN-R01: /meus-canais filtra canais com tipo referencia', () => {
    const visiveis = filterCanaisVisiveis([CANAL_PROPRIO, CANAL_REF], 'proprios');
    expect(visiveis.map((c) => c.id)).toEqual(['c1']);
  });

  it('CAN-R01: /canais (modo todos) lista todos os canais, incluindo referencia', () => {
    const visiveis = filterCanaisVisiveis([CANAL_PROPRIO, CANAL_REF], 'todos');
    expect(visiveis.map((c) => c.id)).toEqual(['c1', 'c2']);
  });

  it('CAN-R01: canal criado em /meus-canais nasce tipo proprio mesmo se o form marca referencia', () => {
    const doc = buildCanalDoc({
      nome: 'Novo Canal',
      handle: '',
      nicho: '',
      tipo: 'referencia',
      inscritos: '100',
      modoLista: 'proprios',
    });
    expect(doc.tipo).toBe('proprio');
  });

  it('CAN-R01: canal criado em /canais respeita o tipo escolhido', () => {
    const doc = buildCanalDoc({
      nome: 'Ref Top',
      handle: '',
      nicho: '',
      tipo: 'referencia',
      inscritos: '100',
      modoLista: 'todos',
    });
    expect(doc.tipo).toBe('referencia');
  });
});

describe('CAN-R02 — isolamento por usuário', () => {
  it('CAN-R02: coleção de canais fica em usuarios/{uid}/canais', () => {
    expect(canaisCollectionPath('u1')).toBe('usuarios/u1/canais');
    expect(canaisCollectionPath('u2')).toBe('usuarios/u2/canais');
    expect(canalDocPath('u1', 'c9')).toBe('usuarios/u1/canais/c9');
  });

  it('CAN-R02: a view lista canais do próprio usuário via /api/v1/fs/usuarios/{uid}/canais', async () => {
    docsByColl = { canais: [CANAL_PROPRIO] };
    const rendered = await renderView(createElement(ChannelsListView, { mode: 'todos' }));
    try {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.startsWith('/api/v1/fs/usuarios/u1/canais'))).toBe(true);
      expect(urls.some((u) => u.includes('/usuarios/u2/'))).toBe(false);
    } finally {
      await unmountView(rendered);
    }
  });
});

describe('CAN-R03 — métricas do canal', () => {
  it('CAN-R03: doc novo carrega inscritos, views30d, ctrMedio, retencaoMedia e frequenciaSemanal', () => {
    const doc = buildCanalDoc({
      nome: '  Canal Novo  ',
      handle: '',
      nicho: '',
      tipo: 'proprio',
      inscritos: '1500',
      modoLista: 'proprios',
    });
    expect(doc).toMatchObject({
      nome: 'Canal Novo',
      handle: '@canalnovo',
      nicho: 'Geral',
      tipo: 'proprio',
      inscritos: 1500,
      views30d: 0,
      ctrMedio: 6.5,
      retencaoMedia: 50.0,
      frequenciaSemanal: 1,
      descricao: '',
    });
  });

  it('CAN-R03: card do canal exibe Inscritos, CTR Médio e Retenção', async () => {
    docsByColl = { canais: [CANAL_PROPRIO] };
    const rendered = await renderView(createElement(ChannelsListView, { mode: 'todos' }));
    try {
      const text = rendered.container.textContent || '';
      expect(text).toContain('Inscritos');
      expect(text).toContain('CTR Médio');
      expect(text).toContain('Retenção');
      expect(text).toContain('12.345'); // inscritos formatado pt-BR
      expect(text).toContain('6.5%');
      expect(text).toContain('52.5%');
    } finally {
      await unmountView(rendered);
    }
  });
});

describe('CAN-R05 — rotas /canais e /canais/{id}', () => {
  it('CAN-R05: rota base da lista de canais é /canais', () => {
    expect(CANAIS_ROUTE).toBe('/canais');
  });

  it('CAN-R05: rota de detalhe do canal é /canais/{id}', () => {
    expect(canalDetailRoute('c1')).toBe('/canais/c1');
    expect(canalDetailRoute('abc-123')).toBe('/canais/abc-123');
  });

  it('CAN-R05: cada card da lista aponta para o detalhe /canais/{id}', async () => {
    docsByColl = { canais: [CANAL_PROPRIO, CANAL_REF] };
    const rendered = await renderView(createElement(ChannelsListView, { mode: 'todos' }));
    try {
      const links = Array.from(rendered.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(links).toContain('/canais/c1');
      expect(links).toContain('/canais/c2');
    } finally {
      await unmountView(rendered);
    }
  });

  it('CAN-R01+CAN-R05: /meus-canais renderiza só o canal próprio com link de detalhe', async () => {
    docsByColl = { canais: [CANAL_PROPRIO, CANAL_REF] };
    const rendered = await renderView(createElement(ChannelsListView, { mode: 'proprios' }));
    try {
      const text = rendered.container.textContent || '';
      expect(text).toContain('Canal Tech BR');
      expect(text).not.toContain('Canal Referência');
      const links = Array.from(rendered.container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(links).toContain('/canais/c1');
      expect(links).not.toContain('/canais/c2');
    } finally {
      await unmountView(rendered);
    }
  });
});