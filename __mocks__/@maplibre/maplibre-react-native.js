const React = require('react');
const { View } = require('react-native');

const MapView = (props) => React.createElement(View, { testID: 'mock-mapview', ...props });
const Camera = (props) => React.createElement(View, { testID: 'mock-camera', ...props });
const Marker = (props) => React.createElement(View, { testID: 'mock-marker', ...props });
const UserLocation = (props) => React.createElement(View, { testID: 'mock-user-location', ...props });

const ShapeSource = (props) => React.createElement(View, { testID: 'mock-shape-source', ...props });
const LineLayer = (props) => React.createElement(View, { testID: 'mock-line-layer', ...props });
const PointAnnotation = (props) => React.createElement(View, { testID: 'mock-point-annotation', ...props });
const GeoJSONSource = (props) => React.createElement(View, { testID: 'mock-geojson-source', ...props });
const Layer = (props) => React.createElement(View, { testID: 'mock-layer', ...props });

module.exports = {
  Map: MapView,
  Camera,
  Marker,
  UserLocation,
  ShapeSource,
  LineLayer,
  PointAnnotation,
  GeoJSONSource,
  Layer,
};
