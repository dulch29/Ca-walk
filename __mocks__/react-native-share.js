// Jest stub: react-native-share needs a native module that doesn't exist in tests
const RNShare = {
  open: async () => ({ success: true, message: '' }),
  shareSingle: async () => ({ success: true, message: '' }),
  isPackageInstalled: async () => ({ isInstalled: false, message: '' }),
};

module.exports = { __esModule: true, default: RNShare };
