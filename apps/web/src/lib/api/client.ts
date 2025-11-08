'use client';

import { API_URL, getAccessToken, ensureAccess, tryRefresh, setSession } from './session';

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

async function doFetch(path: string, opts: RequestInit = {}, retry = true): Promise<Response> {
  // Ensure we have a valid access token before making the request
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

  // Handle 401 Unauthorized - token expired or invalid
  if (res.status === 401 && retry && typeof window !== 'undefined') {
    console.log('Token expired, attempting refresh...');
    const ok = await tryRefresh();

    if (ok) {
      console.log('Token refreshed successfully, retrying request...');
      // Retry the request with the new token
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
      console.error('Token refresh failed, redirecting to login...');
      setSession(undefined);
      // Redirect to login on auth failure
      const currentPath = window.location.pathname;
      const loginUrl = `/login?next=${encodeURIComponent(currentPath)}`;
      window.location.href = loginUrl;
      throw new Error('Session expired. Please login again.');
    }
  }

  return res;
}

export async function fetchJSON<T = unknown>(path: string, opts?: RequestInit, retry = true): Promise<T> {
  const res = await doFetch(path, opts, retry);
  const data = await safeJson(res);

  if (!res.ok) {
    const msg = readErrorMessage(data) ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}
