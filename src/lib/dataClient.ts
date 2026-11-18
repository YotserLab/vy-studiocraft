export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  isAdmin: boolean;
  mfaEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AuthRuntimeConfig {
  signupOpen: boolean;
  hasUsers: boolean;
  devMode: boolean;
  useMockData: boolean;
  adminEmailHint?: string;
}

export interface FsDoc<T = Record<string, unknown>> {
  exists: boolean;
  id: string;
  path: string;
  coll: string;
  parent: string;
  uid: string | null;
  data: T;
  createdAt: number;
  updatedAt: number;
}

export interface ListQueryOptions {
  where?: { field: string; op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains'; value: unknown };
  orderBy?: { field: string; desc?: boolean };
  limit?: number;
}

export interface FileItem {
  name: string;
  fullPath: string;
  size: number;
  contentType: string;
  updated: number;
  url: string;
}

export interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  source: string;
}

export interface GeneratedScript {
  title: string;
  thumbnailIdeas: string[];
  hook0to30: string;
  promise: string;
  chapters: Array<{
    heading: string;
    durationHint: string;
    scriptText: string;
    visualCue: string;
  }>;
  retentionBeats: string[];
  cta: string;
  estimatedDurationMin: number;
}

export interface Comparison30sResult {
  winner: 'A' | 'B' | 'empate';
  summary: string;
  criteria: Array<{
    name: string;
    assessmentA: string;
    assessmentB: string;
    edge: 'A' | 'B' | 'empate';
  }>;
  improvedHookA: string;
  improvedHookB: string;
  actionChecklist: string[];
}

export interface AuditEvent {
  id: number;
  userId: string | null;
  action: string;
  detail: string;
  createdAt: number;
}

// Sentinels matching spec §5
export const deleteField = () => ({ __del: 1 as const });
export const increment = (n: number) => ({ __inc: n });
export const serverTimestamp = () => ({ __svts: 1 as const });

const TOKEN_STORAGE_KEY = 'vysc_sess_token';
let memorySessionToken: string | null = null;

export function getSessionToken(): string | null {
  if (memorySessionToken) return memorySessionToken;
  try {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      memorySessionToken = saved;
      return saved;
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

export function setSessionToken(token: string | null | undefined): void {
  const clean = token && token.trim() ? token.trim() : null;
  memorySessionToken = clean;
  try {
    if (clean) {
      localStorage.setItem(TOKEN_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage access issues
  }
}

export function withAuthTokenUrl(url: string): string {
  const token = getSessionToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (res.ok) {
        throw new Error(
          contentType.includes('text/html')
            ? 'Resposta HTML inesperada da API.'
            : 'Resposta JSON inválida do servidor.'
        );
      }
      parsed = { error: text || `Erro HTTP ${res.status}` };
    }
  }
  if (!res.ok) {
    if (res.status === 401 && url === '/api/v1/auth/me') {
      setSessionToken(null);
    }
    const err = new Error(String(parsed.error || `Erro HTTP ${res.status}`)) as Error & {
      status?: number;
      reauthRequired?: boolean;
    };
    err.status = res.status;
    err.reauthRequired = Boolean(parsed.reauthRequired);
    throw err;
  }
  return parsed as T;
}

export const authApi = {
  config: () => apiJson<AuthRuntimeConfig>('/api/v1/auth/config'),
  me: async () => {
    const res = await apiJson<{ user: UserProfile; devMode: boolean; token?: string }>('/api/v1/auth/me');
    if (res.token) setSessionToken(res.token);
    return res;
  },
  token: () => apiJson<{ token: string }>('/api/v1/auth/token'),
  signup: async (email: string, password: string, name: string) => {
    const res = await apiJson<{ user: UserProfile; token?: string }>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (res.token) setSessionToken(res.token);
    return res;
  },
  login: async (email: string, password: string) => {
    const res = await apiJson<{
      user?: UserProfile;
      token?: string;
      mfaRequired?: boolean;
      ticket?: string;
      hints?: { email: string };
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setSessionToken(res.token);
    return res;
  },
  mfaLogin: async (ticket: string, code: string) => {
    const res = await apiJson<{ user: UserProfile; token?: string }>('/api/v1/auth/mfa/login', {
      method: 'POST',
      body: JSON.stringify({ ticket, code }),
    });
    if (res.token) setSessionToken(res.token);
    return res;
  },
  logout: async () => {
    try {
      return await apiJson<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setSessionToken(null);
    }
  },
  updateProfile: (displayName: string) =>
    apiJson<{ user: UserProfile }>('/api/v1/auth/profile', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    }),
  verifyEmail: () =>
    apiJson<{ ok: boolean; user: UserProfile; debugLink?: string }>('/api/v1/auth/verify-email', {
      method: 'POST',
    }),
  reauth: (password: string) =>
    apiJson<{ ok?: boolean; mfaRequired?: boolean; ticket?: string }>('/api/v1/auth/reauth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  mfaReauth: (ticket: string, code: string) =>
    apiJson<{ ok: boolean }>('/api/v1/auth/mfa/reauth', {
      method: 'POST',
      body: JSON.stringify({ ticket, code }),
    }),
  mfaStart: () => apiJson<{ secret: string }>('/api/v1/auth/mfa/start', { method: 'POST' }),
  mfaEnroll: (secret: string, code: string) =>
    apiJson<{ ok: boolean; user: UserProfile }>('/api/v1/auth/mfa/enroll', {
      method: 'POST',
      body: JSON.stringify({ secret, code }),
    }),
  mfaUnenroll: () => apiJson<{ ok: boolean; user: UserProfile }>('/api/v1/auth/mfa/unenroll', { method: 'POST' }),
  requestReset: (email: string) =>
    apiJson<{ ok: boolean; message: string; debugLink?: string }>('/api/v1/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  confirmReset: (token: string, password: string) =>
    apiJson<{ ok: boolean }>('/api/v1/auth/reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

function encodeCleanPath(p: string): string {
  return p
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

export const fsApi = {
  getDoc: <T = Record<string, unknown>>(docPath: string) =>
    apiJson<FsDoc<T>>(`/api/v1/fs/${encodeCleanPath(docPath)}`),

  listDocs: async <T = Record<string, unknown>>(collPath: string, opts: ListQueryOptions = {}): Promise<FsDoc<T>[]> => {
    const params = new URLSearchParams();
    if (opts.where) {
      const val =
        typeof opts.where.value === 'string' ? opts.where.value : JSON.stringify(opts.where.value);
      params.set('where', `${opts.where.field}|${opts.where.op}|${val}`);
    }
    if (opts.orderBy) {
      params.set('orderBy', `${opts.orderBy.field}${opts.orderBy.desc ? ':desc' : ''}`);
    }
    if (opts.limit) {
      params.set('limit', String(opts.limit));
    }
    const qs = params.toString();
    const res = await apiJson<{ docs?: FsDoc<T>[] }>(
      `/api/v1/fs/${encodeCleanPath(collPath)}${qs ? `?${qs}` : ''}`
    );
    return Array.isArray(res?.docs) ? res.docs : [];
  },

  createDoc: <T = Record<string, unknown>>(collPath: string, data: Record<string, unknown>) =>
    apiJson<FsDoc<T>>(`/api/v1/fs/${encodeCleanPath(collPath)}`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),

  setDoc: <T = Record<string, unknown>>(docPath: string, data: Record<string, unknown>, merge = false) =>
    apiJson<FsDoc<T>>(`/api/v1/fs/${encodeCleanPath(docPath)}`, {
      method: 'PUT',
      body: JSON.stringify({ data, merge }),
    }),

  patchDoc: <T = Record<string, unknown>>(docPath: string, data: Record<string, unknown>) =>
    apiJson<FsDoc<T>>(`/api/v1/fs/${encodeCleanPath(docPath)}`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    }),

  deleteDoc: (docPath: string) =>
    apiJson<{ ok: boolean; path: string }>(`/api/v1/fs/${encodeCleanPath(docPath)}`, {
      method: 'DELETE',
    }),

  subscribe: (watchPath: string, onChange: (changedPath: string) => void): (() => void) => {
    const token = getSessionToken();
    const qs = new URLSearchParams({ path: watchPath });
    if (token) qs.set('token', token);
    const es = new EventSource(`/api/v1/fs/events?${qs.toString()}`, {
      withCredentials: true,
    });
    es.addEventListener('change', (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as { path: string };
        onChange(parsed.path);
      } catch {
        onChange(watchPath);
      }
    });
    return () => {
      es.close();
    };
  },
};

export const filesApi = {
  list: async (prefix: string) => {
    const res = await apiJson<{ items?: FileItem[]; prefixes?: string[] }>(
      `/api/v1/files?prefix=${encodeURIComponent(prefix)}`
    );
    const rawItems = Array.isArray(res?.items) ? res.items : [];
    const rawPrefixes = Array.isArray(res?.prefixes) ? res.prefixes : [];
    return {
      items: rawItems.map((item) => ({ ...item, url: withAuthTokenUrl(item.url) })),
      prefixes: rawPrefixes,
    };
  },

  upload: async (fullPath: string, file: File): Promise<FileItem> => {
    const params = new URLSearchParams({
      name: file.name,
      ct: file.type || 'application/octet-stream',
    });
    const token = getSessionToken();
    const res = await fetch(`/api/v1/files/${encodeCleanPath(fullPath)}?${params.toString()}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || 'Falha ao enviar arquivo.');
    }
    const item = (await res.json()) as FileItem;
    return { ...item, url: withAuthTokenUrl(item.url) };
  },

  meta: async (fullPath: string) => {
    const item = await apiJson<FileItem>(`/api/v1/files/${encodeCleanPath(fullPath)}/meta`);
    return { ...item, url: withAuthTokenUrl(item.url) };
  },

  remove: (fullPath: string) =>
    apiJson<{ ok: boolean }>(`/api/v1/files/${encodeCleanPath(fullPath)}`, { method: 'DELETE' }),
};

export const feedApi = {
  fetchRss: async (url: string): Promise<{ channelTitle: string; items: RssFeedItem[] }> => {
    const res = await fetch(`/api/feed?url=${encodeURIComponent(url)}`, { credentials: 'include' });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || `Erro ao carregar feed (${res.status})`);
    }
    const xmlText = await res.text();
    // NOT-R01, NOT-R02, NOT-R03: proxy + parse RSS/Atom
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const channelTitle =
      doc.querySelector('channel > title, feed > title')?.textContent?.trim() || new URL(url).hostname;

    const rssItems = Array.from(doc.querySelectorAll('item'));
    if (rssItems.length > 0) {
      return {
        channelTitle,
        items: rssItems.slice(0, 24).map((el) => ({
          title: el.querySelector('title')?.textContent?.trim() || 'Sem título',
          link: el.querySelector('link')?.textContent?.trim() || url,
          pubDate: el.querySelector('pubDate')?.textContent?.trim() || '',
          summary: (el.querySelector('description')?.textContent || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 220),
          source: channelTitle,
        })),
      };
    }

    const atomEntries = Array.from(doc.querySelectorAll('entry'));
    return {
      channelTitle,
      items: atomEntries.slice(0, 24).map((el) => ({
        title: el.querySelector('title')?.textContent?.trim() || 'Sem título',
        link: el.querySelector('link')?.getAttribute('href') || url,
        pubDate:
          el.querySelector('published, updated')?.textContent?.trim() || '',
        summary: (el.querySelector('summary, content')?.textContent || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 220),
        source: channelTitle,
      })),
    };
  },
};

export interface AssistantIdeaAction {
  titulo: string;
  hook?: string;
  resumo?: string;
  porque?: string;
  canal?: string;
  categoria?: string;
}

export const aiApi = {
  generateScript: (payload: {
    topic: string;
    channelName: string;
    niche: string;
    audience: string;
    format: 'long' | 'shorts';
    tone: string;
    durationMinutes: number;
    hookStyle: string;
    notes?: string;
    profilePrompt?: string;
    partsCount?: number;
    ppm?: number;
    angle?: string;
    knowledgeBase?: string;
  }) =>
    apiJson<{ script: GeneratedScript }>('/api/v1/ai/script', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  compare30s: (payload: {
    titleA: string;
    hookA: string;
    visualCutsA: string;
    titleB: string;
    hookB: string;
    visualCutsB: string;
    niche: string;
  }) =>
    apiJson<{ comparison: Comparison30sResult }>('/api/v1/ai/compare-30s', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  chat: (payload: {
    messages: Array<{ role: 'user' | 'assistant'; text: string }>;
    projectId?: string;
  }) =>
    apiJson<{ reply: string; ideaAction: AssistantIdeaAction | null }>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  action: <T = unknown>(action: string, payload: Record<string, unknown> = {}) =>
    apiJson<{ text?: string; data?: T }>('/api/v1/ai/action', {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
    }),
};

export const adminApi = {
  listAudit: () => apiJson<{ events: AuditEvent[] }>('/api/v1/admin/audit'),
};

export const devApi = {
  reseed: () => apiJson<{ ok: boolean; message: string }>('/api/v1/dev/seed', { method: 'POST' }),
};
