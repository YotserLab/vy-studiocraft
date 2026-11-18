// T25 — Regras da biblioteca: BIB-R01, BIB-R02, BIB-R03, BIB-R04 + MID-R06.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanSubFolder,
  folderDisplayName,
  libraryBasePrefix,
  relativePrefixSegments,
  uploadTargetPath,
} from '../lib/bibliotecaLogic';
import { buildVideoSalvoDoc, isVideoSalvoTituloValido, videosSalvosCollectionPath } from '../lib/midiaLogic';
import { filesApi } from '../lib/dataClient';
import { LibraryView } from './MediaAndContentViews';

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

let filesListing: { items: unknown[]; prefixes: string[] } = { items: [], prefixes: [] };
const fetchMock = vi.fn(async (input: unknown): Promise<Response> => {
  const url = String(input);
  if (url.startsWith('/api/v1/files?')) {
    return okJson(filesListing);
  }
  if (url.startsWith('/api/v1/files/')) {
    return okJson({ name: 'capa.png', fullPath: 'usuarios/u1/thumbs/capa.png', size: 3, contentType: 'image/png', updated: 0, url: '/api/v1/files/usuarios/u1/thumbs/capa.png' });
  }
  return okJson({ docs: [] });
});
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  filesListing = { items: [], prefixes: [] };
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

describe('BIB-R01 — navegação do prefixo do usuário', () => {
  it('BIB-R01: prefixo base da biblioteca é usuarios/{uid}', () => {
    expect(libraryBasePrefix('u1')).toBe('usuarios/u1');
    expect(libraryBasePrefix('u2')).toBe('usuarios/u2');
  });

  it('BIB-R01: listagem usa GET /api/v1/files?prefix=usuarios/{uid}', async () => {
    await filesApi.list(libraryBasePrefix('u1'));
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.startsWith('/api/v1/files?prefix=')).toBe(true);
    const prefix = new URLSearchParams(url.split('?')[1]).get('prefix');
    expect(prefix).toBe('usuarios/u1');
  });

  it('BIB-R01: breadcrumb mostra apenas segmentos relativos ao prefixo base', () => {
    expect(relativePrefixSegments('usuarios/u1', 'usuarios/u1')).toEqual([]);
    expect(relativePrefixSegments('usuarios/u1/thumbs/capa', 'usuarios/u1')).toEqual(['thumbs', 'capa']);
  });
});

describe('BIB-R02 — subpastas implícitas pelo path', () => {
  it('BIB-R02: input de subpasta é normalizado (trim + barras das pontas)', () => {
    expect(cleanSubFolder('  /thumbs/2024/  ')).toBe('thumbs/2024');
    expect(cleanSubFolder('///')).toBe('');
    expect(cleanSubFolder('')).toBe('');
  });

  it('BIB-R02: subpasta entra no path do upload criando a pasta implicitamente', () => {
    expect(uploadTargetPath('usuarios/u1', 'thumbs', 'capa.png')).toBe('usuarios/u1/thumbs/capa.png');
    expect(uploadTargetPath('usuarios/u1', ' audio/broll ', 'toma.mp3')).toBe('usuarios/u1/audio/broll/toma.mp3');
  });
});

describe('BIB-R03 — upload na pasta atual', () => {
  it('BIB-R03: sem subpasta o alvo é {prefix}/{nome}', () => {
    expect(uploadTargetPath('usuarios/u1', '', 'roteiro.pdf')).toBe('usuarios/u1/roteiro.pdf');
    expect(uploadTargetPath('usuarios/u1', '   ', 'roteiro.pdf')).toBe('usuarios/u1/roteiro.pdf');
  });

  it('BIB-R03: upload usa PUT /api/v1/files/{prefix}/{nome}', async () => {
    const file = new File(['x'], 'capa.png', { type: 'image/png' });
    await filesApi.upload('usuarios/u1/thumbs/capa.png', file);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith('/api/v1/files/usuarios/u1/thumbs/capa.png?')).toBe(true);
    expect(init.method).toBe('PUT');
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('name')).toBe('capa.png');
  });
});

describe('BIB-R04 — listagem separa arquivos de subpastas', () => {
  it('BIB-R04: resposta da API separa items (arquivos) de prefixes (subpastas)', async () => {
    filesListing = {
      items: [{ name: 'video.mp4', fullPath: 'usuarios/u1/video.mp4', size: 2048, contentType: 'video/mp4', updated: 0, url: '/api/v1/files/usuarios/u1/video.mp4' }],
      prefixes: ['usuarios/u1/thumbs', 'usuarios/u1/audio'],
    };
    const res = await filesApi.list('usuarios/u1');
    expect(res.items).toHaveLength(1);
    expect(res.items[0].name).toBe('video.mp4');
    expect(res.prefixes).toEqual(['usuarios/u1/thumbs', 'usuarios/u1/audio']);
  });

  it('BIB-R04: nome exibido da subpasta é o último segmento do prefixo', () => {
    expect(folderDisplayName('usuarios/u1/thumbs')).toBe('thumbs');
    expect(folderDisplayName('usuarios/u1/audio/broll')).toBe('broll');
  });

  it('BIB-R04: LibraryView renderiza subpastas e arquivos em seções separadas', async () => {
    filesListing = {
      items: [{ name: 'video.mp4', fullPath: 'usuarios/u1/video.mp4', size: 2048, contentType: 'video/mp4', updated: 0, url: '/api/v1/files/usuarios/u1/video.mp4' }],
      prefixes: ['usuarios/u1/thumbs'],
    };
    const rendered = await renderView(createElement(LibraryView));
    try {
      const text = rendered.container.textContent || '';
      expect(text).toContain('thumbs');
      expect(text).toContain('video.mp4');
      expect(text).toContain('video/mp4');
      // listagem foi chamada para o prefixo do usuário
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.startsWith('/api/v1/files?prefix=usuarios%2Fu1'))).toBe(true);
    } finally {
      await unmountView(rendered);
    }
  });
});

describe('MID-R06 — vídeo salvo de referência', () => {
  it('MID-R06: título vazio não é válido', () => {
    expect(isVideoSalvoTituloValido('')).toBe(false);
    expect(isVideoSalvoTituloValido('   ')).toBe(false);
    expect(isVideoSalvoTituloValido('MrBeast breakdown')).toBe(true);
  });

  it('MID-R06: canal em branco assume Referência', () => {
    const doc = buildVideoSalvoDoc({ titulo: 'Vídeo X', canal: '  ', url: '', motivoSalvo: '' });
    expect(doc.canal).toBe('Referência');
    expect(doc.categoria).toBe('Referência');
  });

  it('MID-R06: doc registra titulo trimado e defaults da curadoria', () => {
    const doc = buildVideoSalvoDoc({
      titulo: '  Como reter nos 30s  ',
      canal: 'Canal Ref',
      url: 'https://youtu.be/abc',
      motivoSalvo: ' gancho forte ',
    });
    expect(doc).toEqual({
      titulo: 'Como reter nos 30s',
      canal: 'Canal Ref',
      url: 'https://youtu.be/abc',
      duracao: '10:00',
      motivoSalvo: 'gancho forte',
      categoria: 'Referência',
    });
    expect(videosSalvosCollectionPath('u1')).toBe('usuarios/u1/videos_salvos');
  });
});
