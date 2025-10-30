import { TOKENS, setToken, clearToken, getToken } from "../utils/secure.web";

// Öncelik: EXPO_PUBLIC_API_URL (örn: http://localhost:4000)
export const API =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_WEB_PROXY ?? // istersen Next proxy’yi burada yedek olarak kullan
  "http://localhost:4000";

/**
 * authFetch
 * - "/..." path’lerini otomatik API ile birleştirir
 * - Bearer token ekler
 * - Varsayılan credentials = "omit" (CORS sade)
 */
export async function authFetch(
  input: string | URL | Request,
  init: RequestInit = {}
) {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input;

  const url =
    typeof raw === "string" && raw.startsWith("/") ? `${API}${raw}` : raw;

  const headers = new Headers(init.headers ?? {});
  const token = await getToken(TOKENS.access);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const finalInit: RequestInit = {
    ...init,
    headers,
    credentials: init.credentials ?? "omit",
  };

  try {
    return await fetch(url as any, finalInit);
  } catch (err: any) {
    const target = typeof url === "string" ? url : "[Request]";
    throw new Error(`authFetch failed: ${err?.message ?? String(err)} @ ${target}`);
  }
}

// DİKKAT: Swagger’a göre uçlar /auth/*
// (Nest’te global prefix 'api' yoksa böyle olmalı.)
export async function login(email: string, password: string) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include", // web için cookie varsa işe yarar; mobilde sorun çıkarmaz
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.message || "Login failed");
  if (!j?.accessToken) throw new Error("No access token");
  await setToken(TOKENS.access, j.accessToken);
  return j;
}

export async function register(email: string, password: string) {
  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  let j: any = {};
  try { j = await r.json(); } catch {}

  if (!r.ok) throw new Error(j?.message || "Register failed");

  if (j?.accessToken) {
    await setToken(TOKENS.access, j.accessToken);
    return j;
  }

  try {
    const logged = await login(email, password);
    return logged;
  } catch (e: any) {
    throw new Error(e?.message || "Registered, but auto-login failed");
  }
}

export async function refreshAccess(): Promise<string> {
  const r = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const j = await r.json();
  if (!r.ok || !j?.accessToken) throw new Error(j?.message || "Refresh failed");
  await setToken(TOKENS.access, j.accessToken);
  return j.accessToken;
}

export async function logout(): Promise<void> {
  await clearToken(TOKENS.access);
  try {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {}
}
