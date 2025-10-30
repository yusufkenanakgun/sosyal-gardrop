// Web: localStorage fallback (expo-secure-store yok)
export const TOKENS = {
  access: "access",
  refresh: "refresh",
} as const;
export type TokenKey = (typeof TOKENS)[keyof typeof TOKENS];

export async function getToken(key: TokenKey): Promise<string | null> {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
export async function setToken(key: TokenKey, value: string): Promise<void> {
  try { window.localStorage.setItem(key, value); } catch {}
}
export async function clearToken(key: TokenKey): Promise<void> {
  try { window.localStorage.removeItem(key); } catch {}
}
export async function clearAll(): Promise<void> {
  try {
    window.localStorage.removeItem("access");
    window.localStorage.removeItem("refresh");
  } catch {}
}
