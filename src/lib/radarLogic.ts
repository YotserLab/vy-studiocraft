// Regras de domínio do Radar extraídas de src/views/RadarViews.tsx
// (spec: spec/dominios/radar.yaml). Movimentação de funções puras —
// sem mudança de comportamento.
import { fsApi, type FsDoc } from './dataClient';

// type (não interface) para preservar index signature implícita exigida por
// fsApi.createDoc(path, data: Record<string, unknown>)
export type RadarPerfil = {
  nome: string;
  nicho: string;
  formato: string;
  aceleracao: 'alta' | 'media' | 'baixa';
  taxaOutliers: number;
  viewsMedias7d: number;
  concorrencia: string;
  sinais: string[];
  topicosQuentes: string[];
  ultimoSinalAt: number;
};

export interface RadarPautaData {
  titulo: string;
  angulo: string;
  gancho: string;
  estrutura: string[];
  thumbnail: string;
}

// RAD-R06: perfis ficam em usuarios/{uid}/radar_perfis (isolados por usuário)
export function radarPerfisCollectionPath(uid: string): string {
  return `usuarios/${uid}/radar_perfis`;
}

// RAD-R05: lista de perfis se atualiza em tempo real via SSE na coleção radar_perfis
export function subscribeRadarPerfis(
  uid: string,
  onChange: (changedPath: string) => void
): () => void {
  return fsApi.subscribe(radarPerfisCollectionPath(uid), onChange);
}

export interface RadarPerfilInput {
  nome: string;
  nicho: string;
  formato: string;
  aceleracao: RadarPerfil['aceleracao'];
  taxaOutliers: string;
  sinalInicial: string;
}

// RAD-R01 (nome obrigatório, nicho default 'Geral'), RAD-R02 (defaults de
// taxaOutliers/viewsMedias7d), RAD-R03 (concorrencia 'Média'), RAD-R04 (sinal inicial)
export function buildRadarPerfilPayload(
  input: RadarPerfilInput,
  now: number = Date.now()
): RadarPerfil | null {
  const nome = input.nome.trim();
  if (!nome) return null; // RAD-R01
  return {
    nome,
    nicho: input.nicho.trim() || 'Geral', // RAD-R01
    formato: input.formato,
    aceleracao: input.aceleracao,
    taxaOutliers: Number.parseFloat(input.taxaOutliers) || 2.0, // RAD-R02
    viewsMedias7d: 25000, // RAD-R02
    concorrencia: 'Média', // RAD-R03
    sinais: input.sinalInicial.trim()
      ? [input.sinalInicial.trim()]
      : ['Sinal inicial registrado manualmente.'], // RAD-R04
    topicosQuentes: [input.nicho.trim() || nome],
    ultimoSinalAt: now,
  };
}

export interface RadarFilterOptions {
  search: string;
  aceleracao: 'todos' | RadarPerfil['aceleracao'];
}

// RAD-R08: busca filtra por nome ou nicho contendo o termo, sem diferenciar
// maiúsculas; filtro de aceleração é aplicado antes da busca.
export function filterRadarPerfis(
  items: ReadonlyArray<FsDoc<RadarPerfil>>,
  opts: RadarFilterOptions
): FsDoc<RadarPerfil>[] {
  const safeItems = Array.isArray(items) ? items : [];
  return safeItems.filter((item) => {
    const d = item?.data;
    if (!d) return false;
    if (opts.aceleracao !== 'todos' && d.aceleracao !== opts.aceleracao) return false;
    if (opts.search.trim()) {
      const q = opts.search.toLowerCase();
      return Boolean(d.nome?.toLowerCase().includes(q) || d.nicho?.toLowerCase().includes(q));
    }
    return true;
  });
}

// RAD-R09: perfil vira origem de projeto via origemRadarId ("Converter em Projeto")
export function buildProjetoFromRadarPerfil(doc: { id: string; data: RadarPerfil }) {
  return {
    titulo: `Pauta Radar: ${doc.data.nome}`,
    canalNome: 'Tech & Automação BR',
    estagio: 'ideacao' as const,
    formato: doc.data.formato?.toLowerCase().includes('short') ? ('shorts' as const) : ('long' as const),
    prioridade: doc.data.aceleracao === 'alta' ? ('alta' as const) : ('media' as const),
    dataPublicacaoAlvo: '',
    ctrAlvo: 8.0,
    ganchoResumo: doc.data.sinais?.[0] || '',
    checklist: [{ id: 'c1', texto: 'Definir título e conceito de thumbnail', feito: false }],
    origemRadarId: doc.id,
    versaoAtual: 1,
  };
}

// RAD-R09: capítulos derivados da estrutura da pauta gerada por IA
export function buildCapitulosFromPauta(pauta: RadarPautaData) {
  return (pauta.estrutura || []).map((part, idx) => ({
    id: `cap_${idx + 1}`,
    titulo: `${String(idx + 1).padStart(2, '0')} — ${part}`,
    texto: idx === 0 ? pauta.gancho : '',
  }));
}

// RAD-R09: "Criar Projeto com esta Pauta" também vincula origemRadarId
export function buildProjetoFromPauta(doc: { id: string; data: RadarPerfil }, pauta: RadarPautaData) {
  return {
    titulo: pauta.titulo,
    canalNome: 'Canal Principal',
    estagio: 'ideacao' as const,
    formato: doc.data.formato?.toLowerCase().includes('short') ? ('shorts' as const) : ('long' as const),
    prioridade: doc.data.aceleracao === 'alta' ? ('alta' as const) : ('media' as const),
    dataPublicacaoAlvo: '',
    ctrAlvo: 8.5,
    ganchoResumo: pauta.gancho,
    resumo: pauta.angulo,
    thumbConceito: pauta.thumbnail,
    capitulos: buildCapitulosFromPauta(pauta),
    checklist: [{ id: 'c1', texto: 'Revisar gancho e fontes da pauta', feito: false }],
    origemRadarId: doc.id,
    versaoAtual: 1,
  };
}
