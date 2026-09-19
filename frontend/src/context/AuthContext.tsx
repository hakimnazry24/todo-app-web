import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { configureApi } from '../api/client';
import { authApi } from '../api/endpoints';
import type { User } from '../api/types';

const STORAGE_KEY = 'todo.session';

interface StoredSession {
  accessToken: string;
  expiresAt: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  expiresAt: string | null;
  /** True until the stored session has been checked against the API. */
  initializing: boolean;
  /** Set when a session ends by itself (expiry or revocation), not by choice. */
  notice: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (
    username: string,
    password: string,
    phoneNumber: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.accessToken || !parsed?.expiresAt || !parsed?.user) return null;

    // Don't even try a token we already know is past its 30 minutes.
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    readStoredSession(),
  );
  const [initializing, setInitializing] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // The API client reads the token through a ref so it always sees the latest
  // value without needing to be reconfigured on every render.
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const endSession = useCallback((message: string | null) => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setNotice(message);
  }, []);

  useEffect(() => {
    configureApi({
      getToken: () => sessionRef.current?.accessToken ?? null,
      onUnauthorized: (message) => endSession(message),
    });
  }, [endSession]);

  // Confirm with the API that a restored token is still accepted server-side:
  // it may have been revoked by a logout elsewhere.
  useEffect(() => {
    let cancelled = false;

    if (!sessionRef.current) {
      setInitializing(false);
      return;
    }

    authApi
      .me()
      .then((user) => {
        if (cancelled) return;
        setSession((current) => (current ? { ...current, user } : current));
      })
      .catch(() => {
        /* a 401 already cleared the session through onUnauthorized */
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Log the user out the moment the 30 minutes are up, without waiting for the
  // next API call to fail.
  useEffect(() => {
    if (!session) return;

    const msRemaining = new Date(session.expiresAt).getTime() - Date.now();
    if (msRemaining <= 0) {
      endSession('Your session expired. Please log in again.');
      return;
    }

    const timer = window.setTimeout(() => {
      endSession('Your session expired. Please log in again.');
    }, msRemaining);

    return () => window.clearTimeout(timer);
  }, [session, endSession]);

  const persist = useCallback((next: StoredSession) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    setNotice(null);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await authApi.login({ username, password });
      persist({
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
        user: result.user,
      });
    },
    [persist],
  );

  const signup = useCallback(
    async (username: string, password: string, phoneNumber: string) => {
      await authApi.signup({ username, password, phoneNumber });
      await login(username, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Revoking server-side is best effort; the local session goes either way.
    }
    endSession(null);
  }, [endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      expiresAt: session?.expiresAt ?? null,
      initializing,
      notice,
      login,
      signup,
      logout,
      clearNotice: () => setNotice(null),
    }),
    [session, initializing, notice, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
