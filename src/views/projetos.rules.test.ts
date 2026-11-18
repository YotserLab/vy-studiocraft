import {afterEach, describe, expect, it, vi} from 'vitest';
import type {FsDoc} from '../lib/dataClient';
import {
  applyStageMove,
  buildVersaoInicialPayload,
  buildWizardProjectPayload,
  deleteProjectDoc,
  KANBAN_STAGES,
  patchProjectStage,
  projetosCollectionPath,
  WIZARD_STEPS,
  type ProjetoDoc,
  type WizardProjectInput,
} from '../lib/projetosLogic';

const BASE_INPUT: WizardProjectInput = {
  titulo: 'Meu vídeo novo',
  canalNome: 'Canal Principal',
  estagio: 'ideacao',
  formato: 'long',
  prioridade: 'media',
  dataPublicacaoAlvo: '',
  ctrAlvo: '8.0',
  conceitoThumbnail: '',
  ganchoResumo: '',
  origemRadarId: '',
  checklistItems: ['Tarefa A', 'Tarefa B'],
};

function fakeJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: {get: () => 'application/json'},
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function mockFetchOk(body: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue(fakeJsonResponse(body));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function projetoDoc(id: string, data: Partial<ProjetoDoc> = {}): FsDoc<ProjetoDoc> {
  return {
    exists: true,
    id,
    path: `usuarios/u1/projetos/${id}`,
    coll: 'usuarios/u1/projetos',
    parent: 'usuarios/u1',
    uid: 'u1',
    data: {
      titulo: `Projeto ${id}`,
      canalNome: 'Canal Principal',
      estagio: 'ideacao',
      formato: 'long',
      prioridade: 'media',
      dataPublicacaoAlvo: '',
      ctrAlvo: 8,
      ganchoResumo: '',
      checklist: [],
      versaoAtual: 1,
      ...data,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildWizardProjectPayload (PRJ-R01/R03/R05/R07)', () => {
  it('PRJ-R01: titulo vazio ou só espaços bloqueia a criação (retorna null)', () => {
    expect(buildWizardProjectPayload({...BASE_INPUT, titulo: ''})).toBeNull();
    expect(buildWizardProjectPayload({...BASE_INPUT, titulo: '   '})).toBeNull();
  });

  it('PRJ-R01: titulo vai com trim; canalNome em branco assume "Canal Principal"', () => {
    const payload = buildWizardProjectPayload({...BASE_INPUT, titulo: '  Título X ', canalNome: '  '});
    expect(payload?.titulo).toBe('Título X');
    expect(payload?.canalNome).toBe('Canal Principal');
  });

  it('PRJ-R01: canalNome informado é preservado com trim', () => {
    const payload = buildWizardProjectPayload({...BASE_INPUT, canalNome: '  Canal Secundário '});
    expect(payload?.canalNome).toBe('Canal Secundário');
  });

  it('PRJ-R03: ctrAlvo vazio ou não numérico assume 8.0', () => {
    for (const raw of ['', 'abc', '   ']) {
      expect(buildWizardProjectPayload({...BASE_INPUT, ctrAlvo: raw})?.ctrAlvo).toBe(8.0);
    }
  });

  it('PRJ-R03: ctrAlvo "0" cai no default 8.0 (comportamento atual: || após parseFloat)', () => {
    expect(buildWizardProjectPayload({...BASE_INPUT, ctrAlvo: '0'})?.ctrAlvo).toBe(8.0);
  });

  it('PRJ-R03: ctrAlvo numérico válido é preservado', () => {
    expect(buildWizardProjectPayload({...BASE_INPUT, ctrAlvo: '12.5'})?.ctrAlvo).toBe(12.5);
  });

  it('PRJ-R04: todo projeto nasce com versaoAtual = 1', () => {
    expect(buildWizardProjectPayload(BASE_INPUT)?.versaoAtual).toBe(1);
  });

  it('PRJ-R05: itens do checklist inicial viram chk_N sequenciais com feito=false', () => {
    const payload = buildWizardProjectPayload({
      ...BASE_INPUT,
      checklistItems: ['A', 'B', 'C'],
    });
    expect(payload?.checklist).toEqual([
      {id: 'chk_1', texto: 'A', feito: false},
      {id: 'chk_2', texto: 'B', feito: false},
      {id: 'chk_3', texto: 'C', feito: false},
    ]);
  });

  it('PRJ-R07: origemRadarId preenchido vincula o projeto ao perfil do radar', () => {
    const payload = buildWizardProjectPayload({...BASE_INPUT, origemRadarId: 'radar_9'});
    expect(payload?.origemRadarId).toBe('radar_9');
  });

  it('PRJ-R07: origemRadarId vazio vira undefined (vínculo opcional)', () => {
    const payload = buildWizardProjectPayload({...BASE_INPUT, origemRadarId: ''});
    expect(payload?.origemRadarId).toBeUndefined();
  });
});

describe('WIZARD_STEPS (PRJ-R02)', () => {
  it('PRJ-R02: wizard tem exatamente 4 etapas numeradas 1..4', () => {
    expect(WIZARD_STEPS).toHaveLength(4);
    expect(WIZARD_STEPS.map((s) => s.n)).toEqual([1, 2, 3, 4]);
  });

  it('PRJ-R02: etapas são Canal & Formato, Packaging & Gancho, Pipeline & Checklist, Revisão', () => {
    expect(WIZARD_STEPS.map((s) => s.title)).toEqual([
      'Canal & Formato',
      'Packaging & Gancho',
      'Pipeline & Checklist',
      'Revisão Final', // label exibido na UI (spec: "Revisão")
    ]);
  });
});

describe('buildVersaoInicialPayload (PRJ-R04)', () => {
  it('PRJ-R04: doc versoes/v1 nasce com versao=1, autor e resumo da criação', () => {
    const v = buildVersaoInicialPayload({autor: 'Ana', titulo: 'Vídeo X', ganchoResumo: 'hook'});
    expect(v.versao).toBe(1);
    expect(v.autor).toBe('Ana');
    expect(v.resumoMudanca).toBe('Projeto criado via Wizard');
    expect(v.conteudo).toBe('hook');
  });

  it('PRJ-R04: sem gancho, conteúdo cai para o briefing inicial com o título', () => {
    const v = buildVersaoInicialPayload({autor: 'Ana', titulo: '  Vídeo X ', ganchoResumo: '  '});
    expect(v.conteudo).toBe('Briefing inicial para "Vídeo X".');
  });
});

describe('projetosCollectionPath (PRJ-R06)', () => {
  it('PRJ-R06: coleção de projetos fica em usuarios/{uid}/projetos', () => {
    expect(projetosCollectionPath('uid-9')).toBe('usuarios/uid-9/projetos');
  });
});

describe('estágios do Kanban (PRJ-R08)', () => {
  it('PRJ-R08: estágios válidos são ideacao, roteiro, gravacao, edicao, publicado', () => {
    expect(KANBAN_STAGES.map((s) => s.id)).toEqual([
      'ideacao',
      'roteiro',
      'gravacao',
      'edicao',
      'publicado',
    ]);
  });

  it('PRJ-R08: applyStageMove atualiza só o card alvo, sem mutar o array original', () => {
    const original = [projetoDoc('p1', {estagio: 'ideacao'}), projetoDoc('p2', {estagio: 'roteiro'})];
    const next = applyStageMove(original, 'p1', 'edicao');
    expect(next.find((p) => p.id === 'p1')?.data.estagio).toBe('edicao');
    expect(next.find((p) => p.id === 'p2')?.data.estagio).toBe('roteiro');
    // imutabilidade: array e docs originais intactos
    expect(original[0].data.estagio).toBe('ideacao');
    expect(next[0]).not.toBe(original[0]);
    expect(next[1]).toBe(original[1]);
  });

  it('PRJ-R08: mudança de estágio persiste via PATCH no documento do projeto', async () => {
    const fetchMock = mockFetchOk();
    await patchProjectStage('u1', 'p1', 'gravacao');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/fs/usuarios/u1/projetos/p1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({data: {estagio: 'gravacao'}});
  });
});

describe('deleteProjectDoc (PRJ-R09)', () => {
  it('PRJ-R09: exclusão é física — DELETE no documento, sem lixeira', async () => {
    const fetchMock = mockFetchOk({ok: true, path: 'usuarios/u1/projetos/p1'});
    await deleteProjectDoc('u1', 'p1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/fs/usuarios/u1/projetos/p1');
    expect(init.method).toBe('DELETE');
  });
});
