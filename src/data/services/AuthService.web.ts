import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../../config/firebase.web';
import type { AuthUser } from './AuthTypes';

export type { AuthUser } from './AuthTypes';

export function observeAuthState(
  onUser: (user: AuthUser | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onAuthStateChanged(
    auth,
    (user) => onUser(user ? { uid: user.uid, email: user.email } : null),
    onError,
  );
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function createAccount(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
