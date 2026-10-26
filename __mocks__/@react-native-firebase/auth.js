const authInstance = {
  currentUser: { uid: 'mock-user-123', displayName: 'Ca-walk Demo' },
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
};

module.exports = {
  getAuth: jest.fn(() => authInstance),
  GoogleAuthProvider: { credential: jest.fn() },
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
};
module.exports.default = module.exports;
