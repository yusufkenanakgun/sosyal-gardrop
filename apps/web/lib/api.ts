// apps/web/lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
export async function api<T>(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, { ...init });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}
