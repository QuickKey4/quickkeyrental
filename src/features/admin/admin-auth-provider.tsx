import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearAdminSecret,
  getAdminSecret,
  setAdminSecret,
} from "./lib/admin-session";

type AdminAuthContextValue = {
  secret: string | null;
  isAuthenticated: boolean;
  ready: boolean;
  signIn: (secret: string) => void;
  signOut: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSecret(getAdminSecret());
    setReady(true);
  }, []);

  const signIn = useCallback((nextSecret: string) => {
    setAdminSecret(nextSecret);
    setSecret(nextSecret);
    setReady(true);
  }, []);

  const signOut = useCallback(() => {
    clearAdminSecret();
    setSecret(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      secret,
      isAuthenticated: Boolean(secret),
      ready,
      signIn,
      signOut,
    }),
    [secret, ready, signIn, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
