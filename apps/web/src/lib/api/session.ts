'use client';

import { SessionPayload } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Session (memory + localStorage) */
let accessToken: string | null = null;
let refreshToken: string | null = null;
let currentUserId: string | null = null;
let isInitialized = false;

// Sayfa yüklendiğinde otomatik restore et
if (typeof window !== 'undefined') {
  restore();
}

export function setSession(a?: SessionPayload) {
  accessToken = a?.accessToken ?? null;
  refreshToken = a?.refreshToken ?? null;
  currentUserId = a?.userId ?? null;

  if (typeof window !== 'undefined') {
    if (refreshToken) {
      localStorage.setItem('sg_refresh', refreshToken);
      localStorage.setItem('sg_access', accessToken || '');
    } else {
      localStorage.removeItem('sg_refresh');
      localStorage.removeItem('sg_access');
    }

    if (currentUserId) {
      localStorage.setItem('sg_uid', currentUserId);
    } else {
      localStorage.removeItem('sg_uid');
    }
  }
}

export function getAccessToken() {
  if (!isInitialized && typeof window !== 'undefined') {
    restore();
  }
  return accessToken;
}

export function getRefreshToken() {
  if (!isInitialized && typeof window !== 'undefined') {
    restore();
  }
  return refreshToken;
}

export function getCurrentUserId() {
  if (!isInitialized && typeof window !== 'undefined') {
    restore();
  }
  return currentUserId;
}

export function isLoggedIn(): boolean {
  if (!isInitialized && typeof window !== 'undefined') {
    restore();
  }
  return !!refreshToken;
}

/** Sayfa yenilendiğinde refresh/uid geri yükle */
export function restore() {
  if (typeof window === 'undefined') return;

  const storedRefresh = localStorage.getItem('sg_refresh');
  const storedAccess = localStorage.getItem('sg_access');
  const storedUserId = localStorage.getItem('sg_uid');

  if (storedRefresh) {
    refreshToken = storedRefresh;
    accessToken = storedAccess;
    currentUserId = storedUserId;
    isInitialized = true;
  }
}

/** ===== Token Refresh Logic ===== */

let refreshing: Promise<boolean> | null = null;

/** İlk istekten önce access yoksa ve LS'de refresh varsa proaktif yenileme */
export async function ensureAccess() {
  if (!isInitialized && typeof window !== 'undefined') {
    restore();
  }

  if (!accessToken && refreshToken) {
    await tryRefresh();
  }
}

/** Backend tasarımına göre: refresh, Authorization: Bearer <refreshToken> ile yapılır */
export async function tryRefresh(): Promise<boolean> {
  if (!isInitialized && typeof window !== 'undefined') {
    restore();
  }

  if (!refreshToken) return false;

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const headers = new Headers();
        headers.set('authorization', `Bearer ${refreshToken}`);

        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers,
        });

        if (!r.ok) {
          // refresh başarısız → tüm oturum bilgisini temizle
          clearSession();
          return false;
        }

        const data = (await safeJson(r)) as { accessToken?: string; refreshToken?: string };
        if (!data?.accessToken) {
          clearSession();
          return false;
        }

        // access token güncelle
        accessToken = data.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sg_access', accessToken);
        }

        // refresh rotasyonu geldiyse güncelle
        if (data.refreshToken) {
          refreshToken = data.refreshToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem('sg_refresh', refreshToken);
          }
        }

        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearSession();
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export function clearSession() {
  accessToken = null;
  refreshToken = null;
  currentUserId = null;
  isInitialized = false;

  if (typeof window !== 'undefined') {
    localStorage.removeItem('sg_refresh');
    localStorage.removeItem('sg_access');
    localStorage.removeItem('sg_uid');
  }
}

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}
