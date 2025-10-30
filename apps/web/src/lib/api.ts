'use client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** ------- Session state (in-memory + refresh in localStorage) ------- */
let accessToken: string | null = null;
let refreshToken: string | null = null;
let currentUserId: string | null = null;

type SessionPayload = { accessToken: string; refreshToken: string; userId: string };
export function setSession(a?: SessionPayload) {
  accessToken = a?.accessToken ?? null;
  refreshToken = a?.refreshToken ?? null;
  currentUserId = a?.userId ?? null;
  if (typeof window !== 'undefined') {
    if (refreshToken) localStorage.setItem('sg_refresh', refreshToken);
    else localStorage.removeItem('sg_refresh');
    if (currentUserId) localStorage.setItem('sg_uid', currentUserId);
    else localStorage.removeItem('sg_uid');
  }
}

/** Sayfa yenilendiğinde refresh/uid geri yükle */
export function restore() {
  if (typeof window === 'undefined') return;
  refreshToken = localStorage.getItem('sg_refresh');
  currentUserId = localStorage.getItem('sg_uid');
}

/** ------- Low-level fetch (401 → refresh retry) ------- */
async function doFetch(path: string, opts: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(opts.headers);

  // JSON body için varsayılan header (GET/HEAD hariç)
  const method = (opts.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });

  if (res.status === 401 && retry && typeof window !== 'undefined') {
    const rt = localStorage.getItem('sg_refresh');
    const uid = localStorage.getItem('sg_uid');
    if (rt && uid) {
      const r = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, refreshToken: rt }),
      });

      if (r.ok) {
        const data = (await r.json()) as { accessToken: string; refreshToken: string };
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        localStorage.setItem('sg_refresh', refreshToken);
        return doFetch(path, opts, false);
      } else {
        // refresh olmadı → oturumu sıfırla
        setSession(undefined);
      }
    }
  }

  return res;
}

function readErrorMessage(d: unknown): string | null {
  if (typeof d !== 'object' || d === null) return null;
  const maybe: { message?: unknown; error?: unknown } = d as { message?: unknown; error?: unknown };
  if (typeof maybe.message === 'string') return maybe.message;
  if (typeof maybe.error === 'string') return maybe.error;
  return null;
}

/** JSON helper: hata/mesajı tek yerden fırlat */
async function fetchJSON<T = unknown>(path: string, opts?: RequestInit, retry = true): Promise<T> {
  const res = await doFetch(path, opts, retry);
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no-op (boş body)
  }
  if (!res.ok) {
    const msg = readErrorMessage(data) ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

/** ------- Public API ------- */
export const api = {
  /** AUTH */
  async register(email: string, password: string) {
    const data = await fetchJSON<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });

    setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, userId: data.user.id });
    return data;
  },

  async login(email: string, password: string) {
    const data = await fetchJSON<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

    setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, userId: data.user.id });
    return data;
  },

  async me() {
    return fetchJSON<{ id: string; email: string }>('/auth/me');
  },

  async logout() {
    // backend logout (opsiyonel; refresh invalidation vs.)
    try {
      await doFetch('/auth/logout', { method: 'POST' });
    } catch {
      /* swallow */
    }
    setSession(undefined);
  },

  restore,

  /** FILES (MinIO/S3 presign) */
  files: {
    /** Presign PUT: { uploadUrl, key, publicUrl } döner */
    presign(params: { filename: string; contentType: string }) {
      return fetchJSON<{ uploadUrl: string; key: string; publicUrl: string }>('/files/presign', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    /** (opsiyonel) presign GET url’i istenirse */
    downloadUrl(params: { key: string }) {
      return fetchJSON<{ url: string }>(`/files/download-url?key=${encodeURIComponent(params.key)}`);
    },
  },

  /** WARDROBE */
  wardrobe: {
    /** Upload sonrası DB kaydı */
    createItem(params: { objectKey: string; contentType: string; publicUrl: string }) {
      return fetchJSON<WardrobeItem>('/wardrobe/items', { method: 'POST', body: JSON.stringify(params) });
    },
    /** Cursor’lı liste */
    listItems(params: { limit?: number; cursor?: string | null; type?: string }) {
      const q = new URLSearchParams();
      if (params.limit) q.set('limit', String(params.limit));
      if (params.cursor) q.set('cursor', String(params.cursor));
      if (params.type) q.set('type', params.type);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return fetchJSON<ListItemsResponse>(`/wardrobe/items${qs}`);
    },
  },
};

/** ------- Shared Types (frontend) ------- */
export type WardrobeItem = {
  id: string;
  userId: string;
  imageUrl: string | null; // publicUrl
  objectKey: string;
  contentType: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type ListItemsResponse = {
  items: WardrobeItem[];
  nextCursor?: string | null;
};
