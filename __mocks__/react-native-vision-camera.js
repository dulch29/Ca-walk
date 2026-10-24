// Jest stub: vision-camera needs native Nitro modules that don't exist in tests
const React = require('react');
const { View } = require('react-native');

module.exports = {
  Camera: props => React.createElement(View, props),
  useCameraPermission: () => ({ hasPermission: false, requestPermission: async () => false }),
  usePhotoOutput: () => ({ capturePhoto: async () => ({ saveToTemporaryFileAsync: async () => '' }) }),
};
