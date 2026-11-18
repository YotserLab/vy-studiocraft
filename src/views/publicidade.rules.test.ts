// T27 — Regras de publicidade: PUB-R01, PUB-R02, PUB-R03, PUB-R04, PUB-R05, PUB-R06.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCampanhaDoc,
  isMarcaValida,
  PUBLICIDADE_EMPTY_MESSAGE,
  publicidadeCollectionPath,
  publicidadeDocPath,
  updateCampanhaStatus,
} from '../lib/publicidadeLogic';
import { AdvertisingView } from './MediaAndContentViews';

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

const INPUT_BASE = {
  marca: 'ACME Software',
  canalNome: 'Tech & Automação BR',
  formato: 'Integração 60s',
  valorAcordado: 'R$ 5.000',
  prazoEntrega: '2025-12-01',
  entregaveis: '1 vídeo dedicado',
};

describe('PUB-R01 — marca obrigatória', () => {
  it('PUB-R01: marca vazia ou só espaços não é válida', () => {
    expect(isMarcaValida('')).toBe(false);
    expect(isMarcaValida('   ')).toBe(false);
  });

  it('PUB-R01: marca não vazia é válida e é trimada no doc', () => {
    expect(isMarcaValida('ACME')).toBe(true);
    expect(buildCampanhaDoc({ ...INPUT_BASE, marca: '  ACME  ' }).marca).toBe('ACME');
  });
});

describe('PUB-R02 — status inicial', () => {
  it("PUB-R02: campanha nova nasce com status 'negociacao'", () => {
    expect(buildCampanhaDoc(INPUT_BASE).status).toBe('negociacao');
  });
});

describe('PUB-R03 — valor padrão', () => {
  it("PUB-R03: valorAcordado em branco assume 'A definir'", () => {
    expect(buildCampanhaDoc({ ...INPUT_BASE, valorAcordado: '   ' }).valorAcordado).toBe('A definir');
    expect(buildCampanhaDoc(INPUT_BASE).valorAcordado).toBe('R$ 5.000');
  });
});

describe('PUB-R04 — atualização de status via PATCH', () => {
  it('PUB-R04: mudança de status faz PATCH no documento da campanha', async () => {
    await updateCampanhaStatus('u1', 'c9', 'aprovacao');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/fs/usuarios/u1/publicidade/c9');
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(String(init.body)) as { data: { status: string } };
    expect(body.data).toEqual({ status: 'aprovacao' });
  });
});

describe('PUB-R05 — isolamento por usuário', () => {
  it('PUB-R05: campanhas ficam em usuarios/{uid}/publicidade', () => {
    expect(publicidadeCollectionPath('u1')).toBe('usuarios/u1/publicidade');
    expect(publicidadeCollectionPath('u2')).toBe('usuarios/u2/publicidade');
    expect(publicidadeDocPath('u1', 'c9')).toBe('usuarios/u1/publicidade/c9');
  });
});

describe('PUB-R06 — estado vazio', () => {
  it('PUB-R06: mensagem de lista vazia é "Nenhuma campanha de publicidade cadastrada"', () => {
    expect(PUBLICIDADE_EMPTY_MESSAGE).toBe('Nenhuma campanha de publicidade cadastrada.');
  });

  it('PUB-R06: AdvertisingView com zero campanhas exibe o estado vazio', async () => {
    docsByColl = { publicidade: [] };
    const rendered = await renderView(createElement(AdvertisingView));
    try {
      const text = rendered.container.textContent || '';
      expect(text).toContain('Nenhuma campanha de publicidade cadastrada.');
    } finally {
      await unmountView(rendered);
    }
  });
});
