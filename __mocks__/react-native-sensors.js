module.exports = {
  accelerometer: {
    subscribe: () => ({ unsubscribe: () => {} }),
  },
  setUpdateIntervalForType: () => {},
  SensorTypes: {
    accelerometer: 'accelerometer',
  },
};
