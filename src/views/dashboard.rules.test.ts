// T29 — Regras da visão geral: DSH-R01, DSH-R02, DSH-R03, DSH-R04, DSH-R05, DSH-R06.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dashboardCollectionPaths,
  meusCanais,
  projetosAtivos,
  publisPendentes,
  sinaisFortesRadar,
  somaInscritos,
  somaViews30d,
} from '../lib/dashboardLogic';
import type { FsDoc } from '../lib/dataClient';
import { OverviewView } from './OverviewView';

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

const CANAL_PROPRIO = fsDoc('c1', 'canais', { nome: 'Canal Tech', tipo: 'proprio', inscritos: 10000, views30d: 50000 });
const CANAL_PROPRIO_2 = fsDoc('c3', 'canais', { nome: 'Canal Vlog', tipo: 'proprio', inscritos: 2500, views30d: 7000 });
const CANAL_REF = fsDoc('c2', 'canais', { nome: 'Ref Top', tipo: 'referencia', inscritos: 999999, views30d: 888888 });

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

describe('DSH-R01 — coleções agregadas', () => {
  it('DSH-R01: visão geral agrega canais, projetos, publicidade e radar_perfis do usuário', () => {
    expect(dashboardCollectionPaths('u1')).toEqual({
      canais: 'usuarios/u1/canais',
      projetos: 'usuarios/u1/projetos',
      publicidade: 'usuarios/u1/publicidade',
      radar: 'usuarios/u1/radar_perfis',
    });
  });

  it('DSH-R01: OverviewView consulta as 4 coleções ao carregar', async () => {
    const rendered = await renderView(createElement(OverviewView));
    try {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      for (const coll of ['canais', 'projetos', 'publicidade', 'radar_perfis']) {
        expect(urls.some((u) => u.includes(`/api/v1/fs/usuarios/u1/${coll}`))).toBe(true);
      }
    } finally {
      await unmountView(rendered);
    }
  });

  it('DSH-R01: sinais fortes do radar são perfis com aceleracao alta', () => {
    const radar = [
      fsDoc('r1', 'radar_perfis', { nome: 'A', aceleracao: 'alta' }),
      fsDoc('r2', 'radar_perfis', { nome: 'B', aceleracao: 'baixa' }),
    ];
    expect(sinaisFortesRadar(radar).map((r) => r.id)).toEqual(['r1']);
  });
});

describe('DSH-R02 — exclusão de canais de referência', () => {
  it('DSH-R02: meusCanais exclui canais com tipo referencia', () => {
    const out = meusCanais([CANAL_PROPRIO, CANAL_REF, CANAL_PROPRIO_2]);
    expect(out.map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  it('DSH-R02: sem canais próprios a soma é zero', () => {
    expect(somaInscritos(meusCanais([CANAL_REF]))).toBe(0);
    expect(somaViews30d(meusCanais([CANAL_REF]))).toBe(0);
  });
});

describe('DSH-R03 — somas de inscritos e views', () => {
  it('DSH-R03: totalInscritos e totalViews30d somam só os canais próprios', () => {
    const meus = meusCanais([CANAL_PROPRIO, CANAL_REF, CANAL_PROPRIO_2]);
    expect(somaInscritos(meus)).toBe(12500);
    expect(somaViews30d(meus)).toBe(57000);
  });

  it('DSH-R03: campos ausentes/não numéricos somam zero', () => {
    const docs = [fsDoc('c9', 'canais', { inscritos: NaN, views30d: NaN })];
    expect(somaInscritos(docs)).toBe(0);
    expect(somaViews30d(docs)).toBe(0);
  });
});

describe('DSH-R04 — projetos ativos', () => {
  it("DSH-R04: projetosAtivos são projetos com estagio diferente de 'publicado'", () => {
    const projetos = [
      fsDoc('p1', 'projetos', { titulo: 'A', estagio: 'ideacao' }),
      fsDoc('p2', 'projetos', { titulo: 'B', estagio: 'publicado' }),
      fsDoc('p3', 'projetos', { titulo: 'C', estagio: 'edicao' }),
    ];
    expect(projetosAtivos(projetos).map((p) => p.id)).toEqual(['p1', 'p3']);
  });
});

describe('DSH-R05 — publis pendentes', () => {
  it("DSH-R05: publisPendentes são campanhas com status diferente de 'concluida'", () => {
    const publis = [
      fsDoc('x1', 'publicidade', { marca: 'A', status: 'negociacao' }),
      fsDoc('x2', 'publicidade', { marca: 'B', status: 'concluida' }),
      fsDoc('x3', 'publicidade', { marca: 'C', status: 'em_producao' }),
    ];
    expect(publisPendentes(publis).map((p) => p.id)).toEqual(['x1', 'x3']);
  });
});

describe('DSH-R06 — wizard de criação de projeto', () => {
  it('DSH-R06: KPIs e botão "Novo Projeto (Wizard)" abrem o assistente de projeto', async () => {
    docsByColl = {
      canais: [CANAL_PROPRIO, CANAL_REF],
      projetos: [
        fsDoc('p1', 'projetos', { titulo: 'Vídeo A', estagio: 'edicao', canalNome: 'Canal Tech', formato: 'long', prioridade: 'media', dataPublicacaoAlvo: '' }),
        fsDoc('p2', 'projetos', { titulo: 'Vídeo B', estagio: 'publicado', canalNome: 'Canal Tech', formato: 'long', prioridade: 'media', dataPublicacaoAlvo: '' }),
      ],
      publicidade: [fsDoc('x1', 'publicidade', { marca: 'ACME', status: 'negociacao' })],
      radar_perfis: [fsDoc('r1', 'radar_perfis', { nome: 'Perfil A', aceleracao: 'alta', taxaOutliers: 2, viewsMedias7d: 1000, nicho: 'Dev' })],
    };
    const rendered = await renderView(createElement(OverviewView));
    try {
      const text = rendered.container.textContent || '';
      // KPI strip derivado das agregações (DSH-R02..R05)
      expect(text).toContain('Canais Próprios');
      expect(text).toContain('10.000 inscritos acumulados');
      expect(text).toContain('50.000');
      expect(text).toContain('Projetos em Produção');
      expect(text).toContain('Publis em Andamento');
      expect(text).toContain('1 sinais fortes no Radar');

      expect(rendered.container.textContent).not.toContain('Assistente de Novo Projeto');
      const wizardBtn = Array.from(rendered.container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('Novo Projeto (Wizard)')
      );
      expect(wizardBtn).toBeTruthy();
      await act(async () => {
        wizardBtn!.click();
      });
      expect(rendered.container.textContent).toContain('Assistente de Novo Projeto');
    } finally {
      await unmountView(rendered);
    }
  });
});
