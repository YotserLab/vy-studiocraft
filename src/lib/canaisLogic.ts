// Regras de domínio de Canais (CAN) extraídas de ChannelsViews.tsx.
// Movimentos triviais, sem mudança de comportamento.

export type CanalTipo = 'proprio' | 'referencia';

export type CanalDocData = {
  nome: string;
  handle: string;
  nicho: string;
  tipo: CanalTipo;
  inscritos: number;
  views30d: number;
  ctrMedio: number;
  retencaoMedia: number;
  frequenciaSemanal: number;
  descricao: string;
  analiseIa?: string;
}

// CAN-R05 — /canais lista todos os canais; /canais/{id} abre o detalhe (NAV-R07).
export const CANAIS_ROUTE = '/canais';

// CAN-R02 — canais ficam em usuarios/{uid}/canais, isolados por usuário (PLA-R04).
export function canaisCollectionPath(uid: string): string {
  return `usuarios/${uid}/canais`;
}

export function canalDocPath(uid: string, canalId: string): string {
  return `${canaisCollectionPath(uid)}/${canalId}`;
}

// CAN-R05 — rota do detalhe do canal.
export function canalDetailRoute(canalId: string): string {
  return `${CANAIS_ROUTE}/${canalId}`;
}

// CAN-R01 — canal tem tipo 'proprio' ou 'referencia'.
export function isTipoCanalValido(tipo: string): tipo is CanalTipo {
  return tipo === 'proprio' || tipo === 'referencia';
}

// CAN-R01 — /meus-canais (modo 'proprios') filtra tipo diferente de 'referencia';
// /canais (modo 'todos') lista todos os canais do usuário.
export function filterCanaisVisiveis<T extends { data?: { tipo?: string } | null | undefined }>(
  canais: T[],
  mode: 'proprios' | 'todos'
): T[] {
  if (mode !== 'proprios') return canais;
  return canais.filter((c) => c?.data?.tipo !== 'referencia');
}

// CAN-R01 + CAN-R03 — doc criado a partir do formulário da lista de canais.
// Tipo forçado para 'proprio' na visão /meus-canais; métricas nascem com os
// defaults da view (views30d=0, ctrMedio=6.5, retencaoMedia=50, frequenciaSemanal=1).
export interface NovoCanalInput {
  nome: string;
  handle: string;
  nicho: string;
  tipo: CanalTipo;
  inscritos: string;
  modoLista: 'proprios' | 'todos';
}

export function buildCanalDoc(input: NovoCanalInput): CanalDocData {
  const nome = input.nome.trim();
  return {
    nome,
    handle: input.handle.trim() || `@${nome.toLowerCase().replace(/\s+/g, '')}`,
    nicho: input.nicho.trim() || 'Geral',
    tipo: input.modoLista === 'proprios' ? 'proprio' : input.tipo,
    inscritos: Number.parseInt(input.inscritos, 10) || 0,
    views30d: 0,
    ctrMedio: 6.5,
    retencaoMedia: 50.0,
    frequenciaSemanal: 1,
    descricao: '',
  };
}
