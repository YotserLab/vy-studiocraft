// Regras de navegação a nível de App: NAV-R01, NAV-R04, NAV-R05, NAV-R06, NAV-R07, NAV-R08.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const app = vi.hoisted(() => ({
  user: null as null | {
    id: string; email: string; displayName: string; emailVerified: boolean;
    isAdmin: boolean; mfaEnabled: boolean; createdAt: number; updatedAt: number;
  },
  notify: vi.fn(),
}));

vi.mock('./contexts/AppContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./contexts/AppContext')>();
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

function userFixture(isAdmin = false) {
  return {
    id: 'u1', email: 'u@x.com', displayName: 'U', emailVerified: true,
    isAdmin, mfaEnabled: false, createdAt: 0, updatedAt: 0,
  };
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

async function renderAt(path: string) {
  window.history.pushState({}, '', path);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root!.render(createElement(App)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
}

beforeEach(() => {
  app.user = null;
  vi.stubGlobal('fetch', vi.fn(async () => okJson([])));
});

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
  vi.unstubAllGlobals();
});

import { beforeEach } from 'vitest';

describe('NAV-R01: rota privada sem sessão redireciona para /entrar?returnTo', () => {
  it('NAV-R01: /visao-geral anônimo vai para /entrar com returnTo', async () => {
    await renderAt('/visao-geral');
    expect(window.location.pathname).toBe('/entrar');
    expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/visao-geral');
  });
});

describe('NAV-R04: / com usuário logado redireciona para /visao-geral', () => {
  it('NAV-R04: logado em / navega para /visao-geral', async () => {
    app.user = userFixture();
    await renderAt('/');
    expect(window.location.pathname).toBe('/visao-geral');
  });
});

describe('NAV-R05: /templates é pública', () => {
  it('NAV-R05: anônimo em /templates não é redirecionado', async () => {
    await renderAt('/templates');
    expect(window.location.pathname).toBe('/templates');
  });
});

describe('NAV-R06: rota desconhecida renderiza 404', () => {
  it('NAV-R06: /rota-inexistente mostra página 404', async () => {
    app.user = userFixture();
    await renderAt('/rota-inexistente');
    expect(host!.textContent).toContain('404');
    expect(host!.textContent).toContain('Rota não encontrada');
  });
});

describe('NAV-R07: deep link abre o recurso direto', () => {
  it('NAV-R07: /projetos/{id} resolve a rota de detalhe sem 404 nem redirect', async () => {
    app.user = userFixture();
    await renderAt('/projetos/abc123');
    expect(window.location.pathname).toBe('/projetos/abc123');
    expect(host!.textContent).not.toContain('Rota não encontrada');
  });
});

describe('NAV-R08: /admin/{tab} sincroniza a tab com a URL', () => {
  it('NAV-R08: /admin/membros resolve a sub-rota admin', async () => {
    app.user = userFixture(true);
    await renderAt('/admin/membros');
    expect(window.location.pathname).toBe('/admin/membros');
    expect(host!.textContent).not.toContain('Rota não encontrada');
  });
});
