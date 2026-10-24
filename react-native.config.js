// shortcut: frontend-only test builds skip native libs the UI doesn't use yet.
// react-native-sensors' Gradle file (jcenter, AGP 3.5.1, no namespace) breaks on Gradle 9;
// Firebase/Google Sign-In need android/app/google-services.json. Remove an entry when that feature is wired.
const skipAndroid = { platforms: { android: null } };

module.exports = {
  dependencies: {
    'react-native-sensors': skipAndroid,
    '@react-native-firebase/app': skipAndroid,
    '@react-native-firebase/auth': skipAndroid,
    '@react-native-firebase/firestore': skipAndroid,
    '@react-native-google-signin/google-signin': skipAndroid,
  },
};
