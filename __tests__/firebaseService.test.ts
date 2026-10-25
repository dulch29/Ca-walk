import {
  getCurrentFirebaseUser,
  signInWithGoogle,
  signOutFirebase,
} from '../src/services/firebase';

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));

const authMocks = jest.requireMock('@react-native-firebase/auth') as {
  getAuth: jest.Mock;
  GoogleAuthProvider: { credential: jest.Mock };
  signInWithCredential: jest.Mock;
  signOut: jest.Mock;
};
const googleMocks = jest.requireMock('@react-native-google-signin/google-signin') as {
  GoogleSignin: {
    configure: jest.Mock;
    hasPlayServices: jest.Mock;
    signIn: jest.Mock;
  };
};
const mockAuth = { currentUser: { uid: 'user-1' } };

beforeEach(() => {
  jest.clearAllMocks();
  authMocks.getAuth.mockReturnValue(mockAuth);
  googleMocks.GoogleSignin.hasPlayServices.mockResolvedValue(true);
  googleMocks.GoogleSignin.signIn.mockResolvedValue({
    type: 'success',
    data: { idToken: 'google-id-token' },
  });
  authMocks.GoogleAuthProvider.credential.mockReturnValue({ providerId: 'google.com' });
  authMocks.signInWithCredential.mockResolvedValue({ user: { uid: 'user-1' } });
  authMocks.signOut.mockResolvedValue(undefined);
});

test('rejects Google sign-in without a Web Client ID', async () => {
  await expect(signInWithGoogle('')).rejects.toThrow('Web Client ID');
  expect(googleMocks.GoogleSignin.signIn).not.toHaveBeenCalled();
});

test('signs in with the Google ID token and supplied Web Client ID', async () => {
  const result = await signInWithGoogle('web-client-id.apps.googleusercontent.com');

  expect(googleMocks.GoogleSignin.configure).toHaveBeenCalledWith({
    webClientId: 'web-client-id.apps.googleusercontent.com',
  });
  expect(authMocks.GoogleAuthProvider.credential).toHaveBeenCalledWith('google-id-token');
  expect(authMocks.signInWithCredential).toHaveBeenCalledWith(
    mockAuth,
    { providerId: 'google.com' },
  );
  expect(result).toEqual({ user: { uid: 'user-1' } });
});

test('exposes current user and signs out through Firebase Auth', async () => {
  expect(getCurrentFirebaseUser()).toEqual({ uid: 'user-1' });

  await signOutFirebase();
  expect(authMocks.signOut).toHaveBeenCalledWith(mockAuth);
});
