const React = require('react');
const { View } = require('react-native');

const MapView = (props) => React.createElement(View, { testID: 'mock-mapview', ...props });
const Camera = (props) => React.createElement(View, { testID: 'mock-camera', ...props });
const Marker = (props) => React.createElement(View, { testID: 'mock-marker', ...props });
const UserLocation = (props) => React.createElement(View, { testID: 'mock-user-location', ...props });

module.exports = {
  Map: MapView,
  Camera,
  Marker,
  UserLocation,
};
