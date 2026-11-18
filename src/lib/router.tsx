import React, { useSyncExternalStore } from 'react';

// NAV-R02: anti open redirect
export function validateReturnTo(raw: string | null | undefined): string {
  if (!raw) return '/visao-geral';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/visao-geral';
  }
  return trimmed;
}

// NAV-R03: history API + popstate
export function navigate(to: string, replace = false): void {
  const target = to.startsWith('/') ? to : `/${to}`;
  if (replace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

// NAV-R03: lê window.location a cada render via useSyncExternalStore — evita
// que instâncias-pai fiquem com pathname desatualizado quando um efeito-filho
// navega antes do listener do pai ser registrado (causava redirect duplo para
// /entrar?returnTo=/entrar?returnTo=...).
function subscribeLocation(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getLocationSnapshot(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function useLocationPath(): { pathname: string; search: string; searchParams: URLSearchParams } {
  const snap = useSyncExternalStore(subscribeLocation, getLocationSnapshot);
  const q = snap.indexOf('?');
  const pathname = (q === -1 ? snap : snap.slice(0, q)) || '/';
  const search = q === -1 ? '' : snap.slice(q);
  return { pathname, search, searchParams: new URLSearchParams(search) };
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
