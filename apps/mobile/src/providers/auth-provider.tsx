import React, { createContext, useEffect, useMemo, useState } from "react";
import { getToken, TOKENS } from "@/src/utils/secure.web";
import { refreshAccess, logout } from "@/src/services/auth";

type AuthCtx = {
  ready: boolean;
  authed: boolean;
  signOut: () => Promise<void>;
  touch: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx>({
  ready: false,
  authed: false,
  signOut: async () => {},
  touch: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const access = await getToken(TOKENS.access);
      const refresh = await getToken(TOKENS.refresh); // RN'de kullanmıyoruz ama API değişirse hazır
      setAuthed(!!(access || refresh));
      setReady(true);
    })();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authed,
      signOut: async () => {
        await logout();
        setAuthed(false);
      },
      touch: async () => {
        try {
          await refreshAccess();
          setAuthed(true);
        } catch {
          setAuthed(false);
        }
      },
    }),
    [ready, authed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
