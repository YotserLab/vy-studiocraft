import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  authApi,
  fsApi,
  type AuthRuntimeConfig,
  type UserProfile,
} from '../lib/dataClient';
import {
  configAppDocPath,
  resolveRemoteTema,
  TEMA_STORAGE_KEY,
  temaFromLocalStorage,
} from '../lib/configuracoesLogic';

// TEMAS e TemaId vivem em lib/configuracoesLogic (regras CFG) e são re-exportados
// aqui para manter compatibilidade com os imports existentes nas views.
export { TEMAS } from '../lib/configuracoesLogic';
export type { TemaId } from '../lib/configuracoesLogic';
import type { TemaId } from '../lib/configuracoesLogic';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'ok' | 'err' | 'info';
}

interface AppContextValue {
  user: UserProfile | null;
  authLoading: boolean;
  runtimeConfig: AuthRuntimeConfig | null;
  tema: TemaId;
  setTema: (t: TemaId) => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUserDirect: (u: UserProfile | null) => void;
  logout: () => Promise<void>;
  notify: (message: string, tone?: 'ok' | 'err' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyTemaDom(t: TemaId) {
  document.documentElement.setAttribute('data-tema', t);
  if (t === 'claro') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, t);
  } catch {
    // ignore storage quota errors
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [runtimeConfig, setRuntimeConfig] = useState<AuthRuntimeConfig | null>(null);
  const [tema, setTemaState] = useState<TemaId>(() => temaFromLocalStorage());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: 'ok' | 'err' | 'info' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const cfg = await authApi.config();
      setRuntimeConfig(cfg);
      try {
        const me = await authApi.me();
        setUser(me.user);
        try {
          const pref = await fsApi.getDoc<{ tema?: TemaId }>(configAppDocPath(me.user.id));
          const remoteTema = pref.exists ? resolveRemoteTema(pref.data.tema) : null;
          if (remoteTema) {
            setTemaState(remoteTema);
            applyTemaDom(remoteTema);
          }
        } catch {
          // keep localStorage theme
        }
      } catch {
        setUser(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    applyTemaDom(tema);
  }, [tema]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const setTema = useCallback(
    async (next: TemaId) => {
      setTemaState(next);
      applyTemaDom(next);
      if (user) {
        try {
          await fsApi.setDoc(configAppDocPath(user.id), { tema: next }, true);
        } catch {
          // localStorage still persisted
        }
      }
    },
    [user]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        runtimeConfig,
        tema,
        setTema,
        refreshAuth,
        setUserDirect: setUser,
        logout,
        notify,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
          role="status"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="vy-card px-4 py-3 text-sm flex items-center justify-between gap-3"
              style={{
                borderColor:
                  t.tone === 'err'
                    ? 'var(--status-err)'
                    : t.tone === 'ok'
                      ? 'var(--status-ok)'
                      : 'var(--border-hairline)',
              }}
            >
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
