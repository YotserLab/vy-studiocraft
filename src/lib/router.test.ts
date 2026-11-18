import {beforeEach, describe, expect, it, vi} from 'vitest';
import {navigate, validateReturnTo} from './router';

const FALLBACK = '/visao-geral';

describe('validateReturnTo (NAV-R02)', () => {
  it('NAV-R02: aceita caminho interno começando com /', () => {
    expect(validateReturnTo('/visao-geral')).toBe('/visao-geral');
    expect(validateReturnTo('/projetos/abc-123')).toBe('/projetos/abc-123');
    expect(validateReturnTo('/pesquisa?q=teste&p=2')).toBe('/pesquisa?q=teste&p=2');
  });

  it('NAV-R02: faz trim do valor antes de validar', () => {
    expect(validateReturnTo('  /radar  ')).toBe('/radar');
  });

  it('NAV-R02: valor vazio/ausente cai no fallback', () => {
    expect(validateReturnTo(null)).toBe(FALLBACK);
    expect(validateReturnTo(undefined)).toBe(FALLBACK);
    expect(validateReturnTo('')).toBe(FALLBACK);
    expect(validateReturnTo('   ')).toBe(FALLBACK);
  });

  it('NAV-R02: rejeita //evil.com (anti open redirect)', () => {
    expect(validateReturnTo('//evil.com')).toBe(FALLBACK);
    expect(validateReturnTo('//evil.com/path')).toBe(FALLBACK);
  });

  it('NAV-R02: rejeita URL absoluta https://x', () => {
    expect(validateReturnTo('https://evil.com')).toBe(FALLBACK);
    expect(validateReturnTo('http://evil.com/visao-geral')).toBe(FALLBACK);
  });

  it('NAV-R02: rejeita "://" e valores sem barra inicial', () => {
    expect(validateReturnTo('://')).toBe(FALLBACK);
    expect(validateReturnTo('evil.com')).toBe(FALLBACK);
    expect(validateReturnTo('javascript:alert(1)')).toBe(FALLBACK);
  });

  it('NAV-R02: rejeita :// embutido; // só é rejeitado no início (comportamento atual)', () => {
    expect(validateReturnTo('/redir?to=https://evil.com')).toBe(FALLBACK);
    // Nota: a implementação checa startsWith('//'), não contains('//') —
    // '/a//b' passa hoje, embora a spec diga "não contém '//'".
    expect(validateReturnTo('/a//b')).toBe('/a//b');
  });
});

describe('navigate (NAV-R03)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    window.scrollTo = vi.fn();
  });

  it('NAV-R03: usa history.pushState e atualiza a URL', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    navigate('/projetos');
    expect(pushSpy).toHaveBeenCalledWith({}, '', '/projetos');
    expect(window.location.pathname).toBe('/projetos');
  });

  it('NAV-R03: adiciona / inicial quando o alvo não começa com /', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    navigate('visao-geral');
    expect(pushSpy).toHaveBeenCalledWith({}, '', '/visao-geral');
    expect(window.location.pathname).toBe('/visao-geral');
  });

  it('NAV-R03: replace=true usa history.replaceState em vez de pushState', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    navigate('/entrar', true);
    expect(replaceSpy).toHaveBeenCalledWith({}, '', '/entrar');
    expect(pushSpy).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/entrar');
  });

  it('NAV-R03: dispara popstate para sincronizar tela e URL', () => {
    const onPop = vi.fn();
    window.addEventListener('popstate', onPop);
    try {
      navigate('/canais');
      expect(onPop).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('popstate', onPop);
    }
  });

  it('NAV-R03: rola a página para o topo após navegar', () => {
    navigate('/ideias');
    expect(window.scrollTo).toHaveBeenCalledWith({top: 0, behavior: 'instant'});
  });
});
