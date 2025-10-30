// Native (Android/iOS): expo-secure-store
import * as SecureStore from "expo-secure-store";

export const TOKENS = {
  access: "access",
  refresh: "refresh",
} as const;
export type TokenKey = (typeof TOKENS)[keyof typeof TOKENS];

export async function getToken(key: TokenKey): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}
export async function setToken(key: TokenKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}
export async function clearToken(key: TokenKey): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
export async function clearAll(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKENS.access),
    SecureStore.deleteItemAsync(TOKENS.refresh),
  ]);
}
