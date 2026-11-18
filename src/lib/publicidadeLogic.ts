// Regras de domínio de Publicidade (PUB) extraídas de
// MediaAndContentViews.tsx (AdvertisingView).
import { fsApi } from './dataClient';

export type CampanhaDocData = {
  marca: string;
  canalNome: string;
  status: string;
  formato: string;
  valorAcordado: string;
  prazoEntrega: string;
  entregaveis: string;
}

// PUB-R05 — campanhas ficam em usuarios/{uid}/publicidade, isoladas por
// usuário (PLA-R04).
export function publicidadeCollectionPath(uid: string): string {
  return `usuarios/${uid}/publicidade`;
}

export function publicidadeDocPath(uid: string, campanhaId: string): string {
  return `${publicidadeCollectionPath(uid)}/${campanhaId}`;
}

// PUB-R01 — campanha exige marca não vazia para ser registrada.
export function isMarcaValida(marca: string): boolean {
  return marca.trim().length > 0;
}

// PUB-R02 — toda campanha nova nasce com status 'negociacao'.
// PUB-R03 — valorAcordado em branco assume 'A definir'.
export interface NovaCampanhaInput {
  marca: string;
  canalNome: string;
  formato: string;
  valorAcordado: string;
  prazoEntrega: string;
  entregaveis: string;
}

export function buildCampanhaDoc(input: NovaCampanhaInput): CampanhaDocData {
  return {
    marca: input.marca.trim(),
    canalNome: input.canalNome,
    status: 'negociacao',
    formato: input.formato,
    valorAcordado: input.valorAcordado.trim() || 'A definir',
    prazoEntrega: input.prazoEntrega,
    entregaveis: input.entregaveis.trim(),
  };
}

// PUB-R04 — status da campanha é atualizado via PATCH no documento.
export async function updateCampanhaStatus(
  uid: string,
  campanhaId: string,
  status: string
): Promise<unknown> {
  return fsApi.patchDoc(publicidadeDocPath(uid, campanhaId), { status });
}

// PUB-R06 — lista vazia exibe este estado.
export const PUBLICIDADE_EMPTY_MESSAGE = 'Nenhuma campanha de publicidade cadastrada.';
