// Regras de domínio da Visão Geral / Dashboard (DSH) extraídas de
// OverviewView.tsx.

// DSH-R01 — a visão geral agrega as coleções canais, projetos, publicidade e
// radar_perfis do usuário.
export function dashboardCollectionPaths(uid: string): {
  canais: string;
  projetos: string;
  publicidade: string;
  radar: string;
} {
  return {
    canais: `usuarios/${uid}/canais`,
    projetos: `usuarios/${uid}/projetos`,
    publicidade: `usuarios/${uid}/publicidade`,
    radar: `usuarios/${uid}/radar_perfis`,
  };
}

// DSH-R02 — meusCanais exclui canais com tipo 'referencia' das somas.
export function meusCanais<T extends { data?: { tipo?: string } | null | undefined }>(canais: T[]): T[] {
  return canais.filter((c) => c?.data?.tipo !== 'referencia');
}

// DSH-R03 — totalInscritos soma o campo inscritos dos canais próprios.
export function somaInscritos<T extends { data?: { inscritos?: number } | null | undefined }>(
  canais: T[]
): number {
  return canais.reduce((acc, c) => acc + (Number(c?.data?.inscritos) || 0), 0);
}

// DSH-R03 — totalViews30d soma o campo views30d dos canais próprios.
export function somaViews30d<T extends { data?: { views30d?: number } | null | undefined }>(
  canais: T[]
): number {
  return canais.reduce((acc, c) => acc + (Number(c?.data?.views30d) || 0), 0);
}

// DSH-R04 — projetosAtivos são projetos com estagio diferente de 'publicado'.
export function projetosAtivos<T extends { data?: { estagio?: string } | null | undefined }>(
  projetos: T[]
): T[] {
  return projetos.filter((p) => p?.data?.estagio !== 'publicado');
}

// DSH-R05 — publisPendentes são campanhas com status diferente de 'concluida'.
export function publisPendentes<T extends { data?: { status?: string } | null | undefined }>(
  publis: T[]
): T[] {
  return publis.filter((p) => p?.data?.status !== 'concluida');
}

// DSH-R01 — agregação derivada exibida na visão geral: perfis do radar com
// aceleracao 'alta' ("sinais fortes").
export function sinaisFortesRadar<T extends { data?: { aceleracao?: string } | null | undefined }>(
  radar: T[]
): T[] {
  return radar.filter((r) => r?.data?.aceleracao === 'alta');
}
