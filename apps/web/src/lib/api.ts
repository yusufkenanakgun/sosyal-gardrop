'use client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** ===== Session (memory + localStorage) ===== */
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

/** Sayfa yenilendiğinde refresh/uid geri yükle (access sadece memory'de tutulur) */
export function restore() {
  if (typeof window === 'undefined') return;
  refreshToken = localStorage.getItem('sg_refresh');
  currentUserId = localStorage.getItem('sg_uid');
}

/** ===== Low-level fetch (401 → refresh retry) ===== */

let refreshing: Promise<boolean> | null = null;

/** İlk istekten önce access yoksa ve LS’de refresh varsa proaktif yenileme */
async function ensureAccess() {
  if (!accessToken) {
    if (!refreshToken && typeof window !== 'undefined') {
      refreshToken = localStorage.getItem('sg_refresh');
      currentUserId = localStorage.getItem('sg_uid');
    }
    if (refreshToken) {
      await tryRefresh();
    }
  }
}

/** Backend tasarımına göre: refresh, Authorization: Bearer <refreshToken> ile yapılır */
async function tryRefresh(): Promise<boolean> {
  if (!refreshToken && typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('sg_refresh');
  }
  if (!refreshToken) return false;

  if (!refreshing) {
    refreshing = (async () => {
      const headers = new Headers();
      headers.set('authorization', `Bearer ${refreshToken}`);

      const r = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers,
      });

      if (!r.ok) {
        // refresh başarısız → tüm oturum bilgisini temizle
        setSession(undefined);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sg_refresh');
        }
        return false;
      }

      const data = (await safeJson(r)) as { accessToken?: string; refreshToken?: string };
      if (!data?.accessToken) {
        setSession(undefined);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sg_refresh');
        }
        return false;
      }

      // access token RAM'e
      accessToken = data.accessToken ?? null;

      // refresh rotasyonu geldiyse LS'e yaz
      if (data.refreshToken) {
        refreshToken = data.refreshToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sg_refresh', refreshToken);
        }
      }

      return !!accessToken;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function doFetch(path: string, opts: RequestInit = {}, retry = true): Promise<Response> {
  await ensureAccess();

  const method = (opts.method ?? 'GET').toString().toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;

  const headers = new Headers(opts.headers);

  if (!isFormData && method !== 'GET' && method !== 'HEAD' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
  });

  if (res.status === 401 && retry && typeof window !== 'undefined') {
    const ok = await tryRefresh();
    if (ok) {
      const retryHeaders = new Headers(opts.headers);
      if (!isFormData && method !== 'GET' && method !== 'HEAD' && !retryHeaders.has('content-type')) {
        retryHeaders.set('content-type', 'application/json');
      }
      if (accessToken) retryHeaders.set('authorization', `Bearer ${accessToken}`);

      return fetch(`${API_URL}${path}`, {
        ...opts,
        headers: retryHeaders,
      });
    } else {
      setSession(undefined);
      throw new Error('UNAUTHORIZED');
    }
  }

  return res;
}

function readErrorMessage(d: unknown): string | null {
  if (typeof d !== 'object' || d === null) return null;
  const maybe = d as { message?: unknown; error?: unknown; detail?: unknown };
  if (typeof maybe.message === 'string') return maybe.message;
  if (typeof maybe.error === 'string') return maybe.error;
  if (typeof maybe.detail === 'string') return maybe.detail;
  return null;
}

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchJSON<T = unknown>(path: string, opts?: RequestInit, retry = true): Promise<T> {
  const res = await doFetch(path, opts, retry);
  const data = await safeJson(res);

  if (!res.ok) {
    const msg = readErrorMessage(data) ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

/** ===== Types ===== */
export type WardrobeItem = {
  id: string;
  userId?: string;
  type: string;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  size?: string | null;
  season?: string | null;
  styleTags?: string[] | null;
  imageUrl: string;
  s3Key?: string | null;
  createdAt: string;
};

export type ListItemsResponse = {
  items: WardrobeItem[];
  nextCursor?: string | null;
};

/** ===== Public API ===== */
export const api = {
  /** AUTH */
  async register(email: string, password: string, name?: string) {
    const data = await fetchJSON<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

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
    const d = await fetchJSON<{ userId: string; email: string }>('/auth/me');
    return { id: d.userId, email: d.email } as { id: string; email: string };
  },

  async logout() {
    try {
      await doFetch('/auth/logout', { method: 'POST' });
    } catch { /* no-op */ }
    setSession(undefined);
  },

  restore,

  /** FILES */
  files: {
    presign(params: { filename: string; contentType: string }) {
      return fetchJSON<{ uploadUrl: string; key: string; publicUrl?: string | null; contentType: string }>(
        '/files/presign',
        { method: 'POST', body: JSON.stringify(params) },
      );
    },

    complete(params: { key: string }) {
      return fetchJSON<WardrobeItem>('/files/complete', { method: 'POST', body: JSON.stringify(params) });
    },

    list(params?: { limit?: number; cursor?: string | null; type?: string }) {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.cursor) q.set('cursor', String(params.cursor));
      if (params?.type) q.set('type', params.type);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return fetchJSON<ListItemsResponse>(`/files/items${qs}`);
    },

    async downloadUrl(key: string) {
      const data = await fetchJSON<{ downloadUrl: string }>(
        `/files/download-url?key=${encodeURIComponent(key)}`
      );
      return data.downloadUrl;
    },
  },
};

export type PresignResult = {
  uploadUrl: string;
  key: string;
  publicUrl?: string | null;
  contentType: string;
};

export const presignUpload: (p: { filename: string; contentType: string }) => Promise<PresignResult>
  = api.files.presign;

export const completeUpload: (key: string) => Promise<WardrobeItem>
  = (key) => api.files.complete({ key });

export const listItems = api.files.list;
