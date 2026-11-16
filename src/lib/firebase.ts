import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { createFirestoreRepository } from './repository.firestore';

/**
 * Firebase entry point. This module is loaded on demand (dynamic import) so the
 * landing page does not download the Firebase SDK.
 *
 * Configuration, in order:
 * 1. VITE_FIREBASE_* variables (optional, for a custom setup);
 * 2. /__/firebase/init.json, served automatically by Firebase Hosting.
 * Without either (local development offline), only the demo is available.
 */

export interface FirebaseServices {
  auth: Auth;
  db: Firestore;
}

function configFromEnv(): FirebaseOptions | null {
  const env = import.meta.env;
  if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) return null;
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

async function configFromHosting(): Promise<FirebaseOptions | null> {
  try {
    const res = await fetch('/__/firebase/init.json', { cache: 'no-store' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
    const json = (await res.json()) as FirebaseOptions;
    return json.apiKey && json.projectId ? json : null;
  } catch {
    return null;
  }
}

let services: Promise<FirebaseServices | null> | null = null;

export function getFirebase(): Promise<FirebaseServices | null> {
  services ??= (async () => {
    const config = configFromEnv() ?? (await configFromHosting());
    if (!config) return null;
    const app = initializeApp(config);
    const auth = getAuth(app);
    auth.languageCode = 'fr';
    return { auth, db: getFirestore(app) };
  })();
  return services;
}

export const PASSWORD_MIN = 8;

/**
 * The "continue" link in Firebase e-mails must point to an authorized domain.
 * If the current domain is not authorized, send the e-mail without the link.
 */
async function withContinueUrl(send: (settings?: { url: string }) => Promise<void>, path: string) {
  try {
    await send({ url: `${window.location.origin}${path}` });
  } catch (e) {
    if ((e as { code?: string }).code === 'auth/unauthorized-continue-uri') await send();
    else throw e;
  }
}

export function resendVerification(user: User) {
  return withContinueUrl((s) => sendEmailVerification(user, s), '/app');
}

export async function signUpWithEmail(auth: Auth, nom: string, email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(user, { displayName: nom.trim() });
  await resendVerification(user).catch(() => {
    // Not blocking: the user can ask for a new e-mail from the app.
  });
  return user;
}

export function signInWithEmail(auth: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function sendReset(auth: Auth, email: string) {
  return withContinueUrl((s) => sendPasswordResetEmail(auth, email.trim(), s), '/connexion');
}

/** Reloads the profile and the ID token, so that a freshly verified e-mail is seen by the security rules. */
export async function refreshUser(user: User) {
  await reload(user);
  await user.getIdToken(true);
}

export { createFirestoreRepository, onAuthStateChanged, signOut };
export type { User };
