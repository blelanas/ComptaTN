import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { FullPageLoader } from '@/components/FullPageLoader';
import { createLocalRepository, DEMO_UID } from './repository.local';
import type { Repository } from './repository';
import type { FirebaseServices, User } from './firebase';

type FirebaseModule = typeof import('./firebase');

export interface SessionUser {
  uid: string;
  email: string;
  nom: string;
  emailVerified: boolean;
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'demo'; user: SessionUser }
  | { status: 'signed-in'; user: SessionUser };

interface SessionValue {
  state: SessionState;
  /** False when Firebase is not configured here (local development): only the demo works. */
  cloudAvailable: boolean | null;
  /** Data access for the current session; null when signed out. */
  repo: Repository | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nom: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
  startDemo: () => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

const DEMO_FLAG = 'raqib.demo';
const DEMO_USER: SessionUser = { uid: DEMO_UID, email: 'demo@raqib.tn', nom: 'Compte démo', emailVerified: true };

function readDemoFlag() {
  try {
    return sessionStorage.getItem(DEMO_FLAG) === '1';
  } catch {
    return false;
  }
}

function writeDemoFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(DEMO_FLAG, '1');
    else sessionStorage.removeItem(DEMO_FLAG);
  } catch {
    // Storage blocked: demo lasts until the page is reloaded.
  }
}

function toSessionUser(u: User): SessionUser {
  const email = u.email ?? '';
  return { uid: u.uid, email, nom: u.displayName?.trim() || email.split('@')[0] || 'Utilisateur', emailVerified: u.emailVerified };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [fb, setFb] = useState<{ mod: FirebaseModule; services: FirebaseServices } | null>(null);
  const [cloudAvailable, setCloudAvailable] = useState<boolean | null>(null);
  /** undefined = not known yet, null = signed out. */
  const [firebaseUser, setFirebaseUser] = useState<User | null | undefined>(undefined);
  /** Bumped when the Firebase user object changes in place (profile, verification). */
  const [userVersion, setUserVersion] = useState(0);
  const [demo, setDemo] = useState(readDemoFlag);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    import('./firebase')
      .then(async (mod) => {
        const services = await mod.getFirebase();
        if (cancelled) return;
        if (!services) {
          setCloudAvailable(false);
          setFirebaseUser(null);
          return;
        }
        setFb({ mod, services });
        setCloudAvailable(true);
        unsubscribe = mod.onAuthStateChanged(services.auth, (u) => {
          setFirebaseUser(u);
          setUserVersion((v) => v + 1);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCloudAvailable(false);
        setFirebaseUser(null);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const state = useMemo<SessionState>(() => {
    if (firebaseUser) return { status: 'signed-in', user: toSessionUser(firebaseUser) };
    if (demo) return { status: 'demo', user: DEMO_USER };
    if (firebaseUser === undefined) return { status: 'loading' };
    return { status: 'signed-out' };
    // userVersion: the Firebase user is mutated in place by reload()/updateProfile().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, demo, userVersion]);

  const who = state.status === 'signed-in' || state.status === 'demo' ? `${state.user.uid}|${state.user.nom}` : null;
  const repo = useMemo<Repository | null>(() => {
    if (state.status === 'demo') return createLocalRepository();
    if (state.status === 'signed-in' && fb) return fb.mod.createFirestoreRepository(fb.services.db, state.user);
    return null;
    // Recreated only when the person (or their name) changes, not on every token refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, who, fb]);

  const requireFirebase = useCallback(() => {
    if (!fb) throw new Error('La connexion n’est pas disponible sur cette version. Utilisez la démo.');
    return fb;
  }, [fb]);

  const value = useMemo<SessionValue>(
    () => ({
      state,
      cloudAvailable,
      repo,
      signIn: async (email, password) => {
        const { mod, services } = requireFirebase();
        await mod.signInWithEmail(services.auth, email, password);
        writeDemoFlag(false);
        setDemo(false);
      },
      signUp: async (nom, email, password) => {
        const { mod, services } = requireFirebase();
        await mod.signUpWithEmail(services.auth, nom, email, password);
        writeDemoFlag(false);
        setDemo(false);
        setUserVersion((v) => v + 1);
      },
      resetPassword: async (email) => {
        const { mod, services } = requireFirebase();
        await mod.sendReset(services.auth, email);
      },
      resendVerification: async () => {
        const { mod, services } = requireFirebase();
        if (services.auth.currentUser) await mod.resendVerification(services.auth.currentUser);
      },
      refreshUser: async () => {
        const { mod, services } = requireFirebase();
        if (services.auth.currentUser) await mod.refreshUser(services.auth.currentUser);
        setUserVersion((v) => v + 1);
      },
      startDemo: () => {
        writeDemoFlag(true);
        setDemo(true);
      },
      signOut: async () => {
        writeDemoFlag(false);
        setDemo(false);
        if (fb && fb.services.auth.currentUser) await fb.mod.signOut(fb.services.auth);
      },
    }),
    [state, cloudAvailable, repo, requireFirebase, fb],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

/** Signed-in user or demo user. Only use below <RequireSession>. */
export function useCurrentUser() {
  const { state, repo } = useSession();
  if ((state.status !== 'signed-in' && state.status !== 'demo') || !repo) {
    throw new Error('useCurrentUser must be used inside <RequireSession>');
  }
  return { user: state.user, repo, isDemo: state.status === 'demo' };
}

/** Routes that need the session (login pages and the app). Keeps Firebase off the landing page. */
export function SessionLayout() {
  return (
    <SessionProvider>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </SessionProvider>
  );
}

export function RequireSession({ children }: { children: ReactNode }) {
  const { state, repo } = useSession();
  const location = useLocation();
  if (state.status === 'loading' || ((state.status === 'signed-in' || state.status === 'demo') && !repo)) {
    return <FullPageLoader />;
  }
  if (state.status === 'signed-out') {
    return <Navigate to="/connexion" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
