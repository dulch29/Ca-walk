import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  type Auth,
  type User,
  type UserCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function getFirebaseAuth(): Auth {
  return getAuth();
}

export function getCurrentFirebaseUser(): User | null {
  return getFirebaseAuth().currentUser;
}

export function subscribeToAuthState(
  listener: (user: User | null) => void,
): () => void {
  return getFirebaseAuth().onAuthStateChanged(listener);
}

export async function signInWithGoogle(
  webClientId: string,
): Promise<UserCredential> {
  const clientId = webClientId.trim();
  if (!clientId) {
    throw new Error('Google Web Client ID is required for sign-in');
  }

  GoogleSignin.configure({ webClientId: clientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (response.type !== 'success' || !response.data.idToken) {
    throw new Error('Google sign-in did not return an ID token');
  }

  const credential = GoogleAuthProvider.credential(response.data.idToken);
  return signInWithCredential(getFirebaseAuth(), credential);
}

export function signOutFirebase(): Promise<void> {
  return signOut(getFirebaseAuth());
}
