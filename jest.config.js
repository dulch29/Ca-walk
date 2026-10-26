module.exports = {
  preset: '@react-native/jest-preset',
  // React Navigation and native UI libs ship ESM, so Jest must transform them
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  testPathIgnorePatterns: ['<rootDir>/.claude/'],
};
