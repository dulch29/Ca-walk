module.exports = {
  getCurrentPosition: (success) => {
    success({
      coords: {
        latitude: 13.7425,
        longitude: 100.5214,
        accuracy: 10,
        speed: 1.5,
      },
      timestamp: Date.now(),
    });
  },
  watchPosition: (success) => {
    success({
      coords: {
        latitude: 13.7425,
        longitude: 100.5214,
        accuracy: 10,
        speed: 1.5,
      },
      timestamp: Date.now(),
    });
    return 1;
  },
  clearWatch: () => {},
  stopObserving: () => {},
  requestAuthorization: async () => 'granted',
};
