import Constants from "expo-constants";
export const API = (Constants.expoConfig?.extra as any)?.apiUrl || "http://localhost:4000";
