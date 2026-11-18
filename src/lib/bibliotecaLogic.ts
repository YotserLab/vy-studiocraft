// Regras de domínio da Biblioteca de Mídia (BIB) extraídas de
// MediaAndContentViews.tsx (LibraryView).

// BIB-R01 — a biblioteca navega o prefixo usuarios/{uid} via
// /api/v1/files?prefix= (MID-R05); prefixo base do usuário.
export function libraryBasePrefix(uid: string): string {
  return `usuarios/${uid}`;
}

// BIB-R02 — subpastas são criadas implicitamente pelo path do upload;
// o input de subpasta é normalizado (trim + barras das pontas removidas).
export function cleanSubFolder(input: string): string {
  return input.trim().replace(/^\/+|\/+$/g, '');
}

// BIB-R02 + BIB-R03 — upload na pasta atual usa PUT /api/v1/files/{prefix}/{nome};
// com subpasta informada o alvo vira {prefix}/{subpasta}/{nome}.
export function uploadTargetPath(prefix: string, subFolderInput: string, fileName: string): string {
  const cleanFolder = cleanSubFolder(subFolderInput);
  const targetDir = cleanFolder ? `${prefix}/${cleanFolder}` : prefix;
  return `${targetDir}/${fileName}`;
}

// BIB-R01 — segmentos do breadcrumb relativos ao prefixo base do usuário.
export function relativePrefixSegments(prefix: string, basePrefix: string): string[] {
  return prefix.replace(basePrefix, '').split('/').filter(Boolean);
}

// BIB-R04 — listagem separa arquivos (items) de subpastas (prefixes);
// o nome exibido da subpasta é o último segmento do prefixo retornado.
export function folderDisplayName(folderPrefix: string): string {
  return folderPrefix.split('/').pop() || folderPrefix;
}
