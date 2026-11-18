// T28 — Regras de configurações: CFG-R01, CFG-R02, CFG-R03, CFG-R04.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configAppDocPath,
  isTemaIdValido,
  resolveRemoteTema,
  resolveStoredTema,
  TEMA_STORAGE_KEY,
  temaFromLocalStorage,
  TEMAS,
  type TemaId,
} from '../lib/configuracoesLogic';
import type { FsDoc, UserProfile } from '../lib/dataClient';
import { AppProvider, useApp } from '../contexts/AppContext';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const api = vi.hoisted(() => ({
  config: vi.fn(),
  me: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('../lib/dataClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/dataClient')>();
  return {
    ...actual,
    authApi: { ...actual.authApi, config: api.config, me: api.me },
    fsApi: { ...actual.fsApi, getDoc: api.getDoc, setDoc: api.setDoc },
  };
});

const USER: UserProfile = {
  id: 'u1',
  email: 'criadora@exemplo.com',
  displayName: 'Criadora',
  emailVerified: true,
  isAdmin: false,
  mfaEnabled: false,
  createdAt: 0,
  updatedAt: 0,
};

type AppCtx = ReturnType<typeof useApp>;
const ctxRef: { current: AppCtx | null } = { current: null };

function Probe() {
  ctxRef.current = useApp();
  return null;
}

interface Rendered {
  container: HTMLDivElement;
  root: Root;
}

async function renderProvider(): Promise<Rendered> {
  ctxRef.current = null;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(AppProvider, { children: createElement(Probe) }));
  });
  return { container, root };
}

async function unmountProvider({ container, root }: Rendered): Promise<void> {
  await act(async () => {
    root.unmount();
  });
  container.remove();
}

function prefDoc(tema: string | undefined, exists = true): FsDoc<{ tema?: string }> {
  return {
    exists,
    id: 'app',
    path: 'usuarios/u1/config/app',
    coll: 'config',
    parent: 'usuarios/u1',
    uid: 'u1',
    createdAt: 0,
    updatedAt: 0,
    data: tema ? { tema } : {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-tema');
  api.config.mockResolvedValue({ signupOpen: false, hasUsers: true, devMode: false, useMockData: false });
  api.me.mockRejectedValue(new Error('401'));
  api.getDoc.mockResolvedValue(prefDoc(undefined, false));
  api.setDoc.mockResolvedValue({});
});

describe('CFG-R01 — persistência do tema', () => {
  it('CFG-R01: tema é gravado em usuarios/{uid}/config/app', () => {
    expect(configAppDocPath('u1')).toBe('usuarios/u1/config/app');
    expect(configAppDocPath('u2')).toBe('usuarios/u2/config/app');
  });

  it('CFG-R01: setTema logado grava { tema } no doc config/app via setDoc merge', async () => {
    api.me.mockResolvedValue({ user: USER, devMode: false });
    api.getDoc.mockResolvedValue(prefDoc('claro'));
    const rendered = await renderProvider();
    try {
      expect(ctxRef.current).not.toBeNull();
      await act(async () => {
        await ctxRef.current!.setTema('roxo');
      });
      expect(api.setDoc).toHaveBeenCalledWith('usuarios/u1/config/app', { tema: 'roxo' }, true);
      expect(document.documentElement.getAttribute('data-tema')).toBe('roxo');
      expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('roxo');
    } finally {
      await unmountProvider(rendered);
    }
  });
});

describe('CFG-R02 — tema só existe se estiver no registro TEMAS', () => {
  it('CFG-R02: registro TEMAS tem exatamente os 6 presets', () => {
    expect(TEMAS.map((t) => t.id).sort()).toEqual(['azul', 'claro', 'escuro', 'roxo', 'tecnologico', 'youtube']);
    for (const t of TEMAS) {
      expect(isTemaIdValido(t.id)).toBe(true);
    }
  });

  it('CFG-R02: valor fora do registro é inválido e cai para claro', () => {
    expect(isTemaIdValido('matrix')).toBe(false);
    expect(isTemaIdValido('')).toBe(false);
    expect(isTemaIdValido(null)).toBe(false);
    expect(resolveStoredTema('matrix' as TemaId)).toBe('claro');
    expect(resolveStoredTema('escuro')).toBe('escuro');
    expect(resolveRemoteTema('matrix')).toBeNull();
    expect(resolveRemoteTema('youtube')).toBe('youtube');
  });

  it('CFG-R02: doc remoto com tema inválido não sobrescreve o tema local', async () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'roxo');
    api.me.mockResolvedValue({ user: USER, devMode: false });
    api.getDoc.mockResolvedValue(prefDoc('matrix'));
    const rendered = await renderProvider();
    try {
      expect(document.documentElement.getAttribute('data-tema')).toBe('roxo');
      expect(ctxRef.current!.tema).toBe('roxo');
    } finally {
      await unmountProvider(rendered);
    }
  });
});

describe('CFG-R03 — fallback localStorage vysc_tema', () => {
  it('CFG-R03: sem login, tema vem do localStorage vysc_tema', async () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'tecnologico');
    const rendered = await renderProvider();
    try {
      expect(document.documentElement.getAttribute('data-tema')).toBe('tecnologico');
      expect(ctxRef.current!.tema).toBe('tecnologico');
      expect(api.getDoc).not.toHaveBeenCalled();
    } finally {
      await unmountProvider(rendered);
    }
  });

  it('CFG-R03: sem valor salvo ou com valor inválido, fallback é claro', async () => {
    expect(temaFromLocalStorage()).toBe('claro');
    localStorage.setItem(TEMA_STORAGE_KEY, 'nao-existe');
    expect(temaFromLocalStorage()).toBe('claro');
    localStorage.clear();
    const rendered = await renderProvider();
    try {
      expect(ctxRef.current!.tema).toBe('claro');
      expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
    } finally {
      await unmountProvider(rendered);
    }
  });
});

describe('CFG-R04 — doc remoto sobrescreve localStorage ao logar', () => {
  it('CFG-R04: ao logar, tema do doc remoto sobrescreve a preferência local', async () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'roxo');
    api.me.mockResolvedValue({ user: USER, devMode: false });
    api.getDoc.mockResolvedValue(prefDoc('escuro'));
    const rendered = await renderProvider();
    try {
      expect(api.getDoc).toHaveBeenCalledWith('usuarios/u1/config/app');
      expect(ctxRef.current!.tema).toBe('escuro');
      expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
      // O tema remoto é regravado no localStorage via applyTemaDom.
      expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('escuro');
    } finally {
      await unmountProvider(rendered);
    }
  });
});
