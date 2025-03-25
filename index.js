/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { PaperProvider } from 'react-native-paper';
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

export default function Main() {
  return (
    <PaperProvider>
      <App />
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);