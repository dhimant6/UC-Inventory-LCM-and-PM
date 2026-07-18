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
  /** Set when the visitor chose "continue as guest" for the demo. */
  guestName: string | null;
  providers: AuthProviderInfo[];
  loading: boolean;
  /** True once the visitor has either signed in or entered the demo. */
  entered: boolean;
  continueAsGuest: (name: string) => void;
  signOut: () => Promise<void>;
}

const GUEST_KEY = 'fl_guest';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  guestName: null,
  providers: [],
  loading: true,
  entered: false,
  continueAsGuest: () => undefined,
  signOut: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [guestName, setGuestName] = useState<string | null>(() => localStorage.getItem(GUEST_KEY));
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

  const continueAsGuest = useCallback((name: string) => {
    const clean = name.trim().slice(0, 60) || 'Guest';
    localStorage.setItem(GUEST_KEY, clean);
    setGuestName(clean);
    // Fire-and-forget: notify the owner someone opened the demo.
    void fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: clean }),
    }).catch(() => undefined);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(GUEST_KEY);
    setGuestName(null);
    if (user) {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      setUser(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        guestName,
        providers,
        loading,
        entered: Boolean(user) || Boolean(guestName),
        continueAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook + provider co-located
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
