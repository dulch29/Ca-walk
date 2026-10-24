// Jest stub: view-shot ships untranspiled ESM and needs a native module
const React = require('react');
const { View } = require('react-native');

const ViewShot = props => React.createElement(View, props);

module.exports = {
  __esModule: true,
  default: ViewShot,
  captureRef: async () => 'file:///mock/highlight.png',
  captureScreen: async () => 'file:///mock/screen.png',
  releaseCapture: () => {},
};
