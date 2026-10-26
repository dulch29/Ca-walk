module.exports = {
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({ data: { idToken: 'mock-id-token' } })),
    signOut: jest.fn(async () => {}),
  },
};
module.exports.default = module.exports;
