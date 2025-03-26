/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import firebase from '@react-native-firebase/app';
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// Your Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration here
  // This is typically automatically handled by the google-services.json
  // or GoogleService-Info.plist, so you might not need to specify it manually
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp();
}
const lightTheme = {
  ...DefaultTheme,
  dark: false, // Ensure dark mode is off
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff', // Force light background
    text: '#000000', // Ensure text is dark
  },
};

export default function Main() {
  return (
    <PaperProvider theme={lightTheme}>
      <App />
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);