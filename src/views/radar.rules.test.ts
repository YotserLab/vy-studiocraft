import {afterEach, describe, expect, it, vi} from 'vitest';
import type {FsDoc} from '../lib/dataClient';
import {
  buildProjetoFromPauta,
  buildProjetoFromRadarPerfil,
  buildRadarPerfilPayload,
  filterRadarPerfis,
  radarPerfisCollectionPath,
  subscribeRadarPerfis,
  type RadarPerfil,
  type RadarPerfilInput,
} from '../lib/radarLogic';

const BASE_INPUT: RadarPerfilInput = {
  nome: 'IA para criadores',
  nicho: 'IA & Automação',
  formato: 'Long (10-15 min)',
  aceleracao: 'alta',
  taxaOutliers: '3.0',
  sinalInicial: '',
};

function perfil(overrides: Partial<RadarPerfil> = {}): RadarPerfil {
  return {
    nome: 'Perfil X',
    nicho: 'Nicho X',
    formato: 'Long (10-15 min)',
    aceleracao: 'media',
    taxaOutliers: 2,
    viewsMedias7d: 25000,
    concorrencia: 'Média',
    sinais: [],
    topicosQuentes: [],
    ultimoSinalAt: 0,
    ...overrides,
  };
}

function doc(id: string, data: RadarPerfil): FsDoc<RadarPerfil> {
  return {
    exists: true,
    id,
    path: `usuarios/u1/radar_perfis/${id}`,
    coll: 'usuarios/u1/radar_perfis',
    parent: 'usuarios/u1',
    uid: 'u1',
    data,
    createdAt: 0,
    updatedAt: 0,
  };
}

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  closed = false;
  private listeners = new Map<string, Set<(ev: MessageEvent) => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (ev: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  emit(type: string, data: string) {
    for (const cb of this.listeners.get(type) ?? []) {
      cb({data} as MessageEvent);
    }
  }

  close() {
    this.closed = true;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeEventSource.instances = [];
});

describe('buildRadarPerfilPayload (RAD-R01..RAD-R04)', () => {
  it('RAD-R01: nome vazio ou só espaços não cria perfil (retorna null)', () => {
    expect(buildRadarPerfilPayload({...BASE_INPUT, nome: ''})).toBeNull();
    expect(buildRadarPerfilPayload({...BASE_INPUT, nome: '   '})).toBeNull();
  });

  it('RAD-R01: nome é persistido com trim; nicho em branco assume "Geral"', () => {
    const payload = buildRadarPerfilPayload({...BASE_INPUT, nome: '  Meu Nicho  ', nicho: '  '});
    expect(payload?.nome).toBe('Meu Nicho');
    expect(payload?.nicho).toBe('Geral');
    // topicosQuentes cai para o nome quando o nicho está em branco
    expect(payload?.topicosQuentes).toEqual(['Meu Nicho']);
  });

  it('RAD-R01: nicho informado é persistido com trim e vira tópico quente', () => {
    const payload = buildRadarPerfilPayload({...BASE_INPUT, nicho: '  Finanças Pessoais '});
    expect(payload?.nicho).toBe('Finanças Pessoais');
    expect(payload?.topicosQuentes).toEqual(['Finanças Pessoais']);
  });

  it('RAD-R02: taxaOutliers vazia/não numérica assume 2.0 e viewsMedias7d assume 25000', () => {
    for (const raw of ['', 'abc', '   ']) {
      const payload = buildRadarPerfilPayload({...BASE_INPUT, taxaOutliers: raw});
      expect(payload?.taxaOutliers).toBe(2.0);
      expect(payload?.viewsMedias7d).toBe(25000);
    }
  });

  it('RAD-R02: taxaOutliers "0" cai no default 2.0 (comportamento atual: || após parseFloat)', () => {
    const payload = buildRadarPerfilPayload({...BASE_INPUT, taxaOutliers: '0'});
    expect(payload?.taxaOutliers).toBe(2.0);
  });

  it('RAD-R02: taxaOutliers numérica válida é preservada', () => {
    const payload = buildRadarPerfilPayload({...BASE_INPUT, taxaOutliers: '3.5'});
    expect(payload?.taxaOutliers).toBe(3.5);
  });

  it('RAD-R03: todo perfil novo nasce com concorrencia "Média"', () => {
    const payload = buildRadarPerfilPayload(BASE_INPUT);
    expect(payload?.concorrencia).toBe('Média');
  });

  it('RAD-R04: sinais recebe o sinal inicial informado (com trim)', () => {
    const payload = buildRadarPerfilPayload({...BASE_INPUT, sinalInicial: '  Vídeo outlier 10x  '});
    expect(payload?.sinais).toEqual(['Vídeo outlier 10x']);
  });

  it('RAD-R04: sem sinal inicial usa o texto padrão de registro manual', () => {
    const payload = buildRadarPerfilPayload({...BASE_INPUT, sinalInicial: '   '});
    expect(payload?.sinais).toEqual(['Sinal inicial registrado manualmente.']);
  });

  it('RAD-R01: ultimoSinalAt é o timestamp de criação', () => {
    const payload = buildRadarPerfilPayload(BASE_INPUT, 1_700_000_000_000);
    expect(payload?.ultimoSinalAt).toBe(1_700_000_000_000);
  });
});

describe('subscribeRadarPerfis / radarPerfisCollectionPath (RAD-R05/RAD-R06)', () => {
  it('RAD-R05: abre EventSource em /api/v1/fs/events apontando para a coleção radar_perfis', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    const onChange = vi.fn();
    const unsubscribe = subscribeRadarPerfis('u123', onChange);

    expect(FakeEventSource.instances).toHaveLength(1);
    const es = FakeEventSource.instances[0];
    expect(es.url).toContain('/api/v1/fs/events?');
    expect(es.url).toContain(`path=${encodeURIComponent('usuarios/u123/radar_perfis')}`);

    es.emit('change', JSON.stringify({path: 'usuarios/u123/radar_perfis/doc9'}));
    expect(onChange).toHaveBeenCalledWith('usuarios/u123/radar_perfis/doc9');

    unsubscribe();
    expect(es.closed).toBe(true);
  });

  it('RAD-R05: evento SSE com payload inválido dispara onChange com o path observado', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    const onChange = vi.fn();
    subscribeRadarPerfis('u123', onChange);
    FakeEventSource.instances[0].emit('change', 'não-é-json');
    expect(onChange).toHaveBeenCalledWith('usuarios/u123/radar_perfis');
  });

  it('RAD-R06: coleção de perfis fica em usuarios/{uid}/radar_perfis', () => {
    expect(radarPerfisCollectionPath('abc-uid')).toBe('usuarios/abc-uid/radar_perfis');
  });
});

describe('filterRadarPerfis (RAD-R08)', () => {
  const items = [
    doc('p1', perfil({nome: 'IA para Criadores', nicho: 'Tecnologia', aceleracao: 'alta'})),
    doc('p2', perfil({nome: 'Vida Fitness', nicho: 'Saúde', aceleracao: 'baixa'})),
    doc('p3', perfil({nome: 'Finanças do Casal', nicho: 'Finanças tech', aceleracao: 'media'})),
  ];

  it('RAD-R08: busca casa por nome contendo o termo, sem diferenciar maiúsculas', () => {
    const result = filterRadarPerfis(items, {search: 'ia para', aceleracao: 'todos'});
    expect(result.map((d) => d.id)).toEqual(['p1']);
  });

  it('RAD-R08: busca também casa por nicho, sem diferenciar maiúsculas', () => {
    const result = filterRadarPerfis(items, {search: 'TECH', aceleracao: 'todos'});
    // p1 tem nicho 'Tecnologia'... não contém 'tech' literal? 'tecnologia' não contém 'tech'
    // p3 tem nicho 'Finanças tech' — contém
    expect(result.map((d) => d.id)).toEqual(['p3']);
  });

  it('RAD-R08: termo sem correspondência retorna lista vazia', () => {
    expect(filterRadarPerfis(items, {search: 'zzz', aceleracao: 'todos'})).toEqual([]);
  });

  it('RAD-R08: busca vazia/em branco não filtra por texto', () => {
    expect(filterRadarPerfis(items, {search: '   ', aceleracao: 'todos'})).toHaveLength(3);
  });

  it('RAD-R08: filtro de aceleração combina com a busca textual', () => {
    const result = filterRadarPerfis(items, {search: 'a', aceleracao: 'alta'});
    expect(result.map((d) => d.id)).toEqual(['p1']);
    // aceleracao 'todos' não filtra por nível
    expect(filterRadarPerfis(items, {search: '', aceleracao: 'todos'})).toHaveLength(3);
    expect(filterRadarPerfis(items, {search: '', aceleracao: 'baixa'}).map((d) => d.id)).toEqual(['p2']);
  });

  it('RAD-R08: itens sem data são descartados e entrada não-array vira []', () => {
    const broken = {...doc('px', perfil()), data: undefined as unknown as RadarPerfil};
    expect(filterRadarPerfis([broken], {search: '', aceleracao: 'todos'})).toEqual([]);
    expect(
      filterRadarPerfis(null as unknown as FsDoc<RadarPerfil>[], {search: '', aceleracao: 'todos'})
    ).toEqual([]);
  });
});

describe('perfil -> projeto (RAD-R09)', () => {
  const radarDoc = doc(
    'radar42',
    perfil({nome: 'IA & Automação', formato: 'Shorts (<60s)', aceleracao: 'alta', sinais: ['Outlier 20x']})
  );

  it('RAD-R09: "Converter em Projeto" vincula origemRadarId ao perfil', () => {
    const payload = buildProjetoFromRadarPerfil(radarDoc);
    expect(payload.origemRadarId).toBe('radar42');
    expect(payload.estagio).toBe('ideacao');
    expect(payload.versaoAtual).toBe(1);
    expect(payload.titulo).toBe('Pauta Radar: IA & Automação');
  });

  it('RAD-R09: formato "short*" vira shorts e aceleração alta vira prioridade alta', () => {
    const payload = buildProjetoFromRadarPerfil(radarDoc);
    expect(payload.formato).toBe('shorts');
    expect(payload.prioridade).toBe('alta');
    const long = buildProjetoFromRadarPerfil(doc('r1', perfil({formato: 'Long (10-15 min)', aceleracao: 'media'})));
    expect(long.formato).toBe('long');
    expect(long.prioridade).toBe('media');
  });

  it('RAD-R09: "Criar Projeto com esta Pauta" também vincula origemRadarId e gera capítulos', () => {
    const pauta = {
      titulo: 'Como a IA mudou roteiros',
      angulo: 'bastidores',
      gancho: 'Você ainda escreve roteiro na mão?',
      estrutura: ['Gancho', 'Contexto', 'Desfecho'],
      thumbnail: 'Antes/depois',
    };
    const payload = buildProjetoFromPauta(radarDoc, pauta);
    expect(payload.origemRadarId).toBe('radar42');
    expect(payload.estagio).toBe('ideacao');
    expect(payload.capitulos).toHaveLength(3);
    expect(payload.capitulos[0]).toEqual({
      id: 'cap_1',
      titulo: '01 — Gancho',
      texto: 'Você ainda escreve roteiro na mão?',
    });
    expect(payload.capitulos[2].titulo).toBe('03 — Desfecho');
    expect(payload.capitulos[2].texto).toBe('');
  });
});
