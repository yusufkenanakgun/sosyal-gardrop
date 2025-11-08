'use client';

// Re-export session management from new API system
export {
  API_URL,
  setSession,
  restore,
  getAccessToken,
  getRefreshToken,
  getCurrentUserId,
  ensureAccess,
  tryRefresh,
  clearSession
} from './api/session';

// Import for internal use
import { API_URL, getAccessToken, ensureAccess, tryRefresh, clearSession } from './api/session';


async function doFetch(path: string, opts: RequestInit = {}, retry = true): Promise<Response> {
  await ensureAccess();

  const method = (opts.method ?? 'GET').toString().toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;

  const headers = new Headers(opts.headers);

  if (!isFormData && method !== 'GET' && method !== 'HEAD' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const accessToken = getAccessToken();
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
      const newAccessToken = getAccessToken();
      if (newAccessToken) retryHeaders.set('authorization', `Bearer ${newAccessToken}`);

      return fetch(`${API_URL}${path}`, {
        ...opts,
        headers: retryHeaders,
      });
    } else {
      clearSession();
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
  /** HTTP Methods */
  get<T = unknown>(path: string) {
    return fetchJSON<T>(path, { method: 'GET' });
  },

  post<T = unknown>(path: string, data?: unknown) {
    return fetchJSON<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T = unknown>(path: string, data?: unknown) {
    return fetchJSON<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T = unknown>(path: string) {
    return fetchJSON<T>(path, { method: 'DELETE' });
  },

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
