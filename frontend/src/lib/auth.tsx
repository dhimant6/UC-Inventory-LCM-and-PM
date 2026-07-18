import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  provider: 'google' | 'microsoft';
  name: string;
  email: string;
  picture?: string;
}

export interface AuthProviderInfo {
  id: 'google' | 'microsoft';
  label: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  providers: AuthProviderInfo[];
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  providers: [],
  loading: true,
  logout: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [providers, setProviders] = useState<AuthProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()).catch(() => ({ user: null })),
      fetch('/api/auth/providers').then((r) => r.json()).catch(() => ({ providers: [] })),
    ]).then(([me, prov]) => {
      setUser(me.user ?? null);
      setProviders(prov.providers ?? []);
      setLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, providers, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook + provider co-located
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
