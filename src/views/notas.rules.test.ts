// T23 — Regras de notas: NTA-R01, NTA-R02, NTA-R03, NTA-R04.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildNotaDoc,
  deleteNota,
  isNotaTituloValido,
  notaDocPath,
  notasCollectionPath,
} from '../lib/notasLogic';

function okJson(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

const fetchMock = vi.fn(async (): Promise<Response> => okJson({ ok: true, path: '' }));
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  fetchMock.mockClear();
});

describe('NTA-R01 — título obrigatório', () => {
  it('NTA-R01: titulo vazio não é válido', () => {
    expect(isNotaTituloValido('')).toBe(false);
    expect(isNotaTituloValido('   ')).toBe(false);
    expect(isNotaTituloValido('\n\t ')).toBe(false);
  });

  it('NTA-R01: titulo não vazio é válido', () => {
    expect(isNotaTituloValido('Checklist de gravação')).toBe(true);
    expect(isNotaTituloValido('  Checklist  ')).toBe(true);
  });
});

describe('NTA-R02 — fixada nasce false', () => {
  it('NTA-R02: nota criada nasce com fixada=false', () => {
    const doc = buildNotaDoc({ titulo: 'Ideias de thumbnail', categoria: 'Editorial', conteudo: 'Testar A/B' });
    expect(doc.fixada).toBe(false);
  });

  it('NTA-R02: doc da nota leva titulo trimado, categoria e conteudo', () => {
    const doc = buildNotaDoc({ titulo: '  Nota  ', categoria: 'Roteiro', conteudo: '  corpo  ' });
    expect(doc).toEqual({ titulo: 'Nota', categoria: 'Roteiro', conteudo: 'corpo', fixada: false });
  });
});

describe('NTA-R03 — isolamento por usuário', () => {
  it('NTA-R03: notas ficam em usuarios/{uid}/notas', () => {
    expect(notasCollectionPath('u1')).toBe('usuarios/u1/notas');
    expect(notasCollectionPath('u2')).toBe('usuarios/u2/notas');
    expect(notaDocPath('u1', 'n9')).toBe('usuarios/u1/notas/n9');
  });
});

describe('NTA-R04 — exclusão física', () => {
  it('NTA-R04: excluir nota faz DELETE do documento (sem lixeira)', async () => {
    fetchMock.mockImplementationOnce(async () => okJson({ ok: true, path: 'usuarios/u1/notas/n9' }));
    const res = await deleteNota('u1', 'n9');
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/fs/usuarios/u1/notas/n9');
    expect(init.method).toBe('DELETE');
    // Sem flag de lixeira no corpo: o DELETE não envia payload de soft-delete.
    expect(init.body).toBeUndefined();
  });
});
