import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './AppNav';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { pushManager } from './app/notifications/pushManager';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setLayoutModeAsync('immersive'); // Hide nav + status bar
    }

    pushManager.start();

    return () => {
      pushManager.stop();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" hidden />
      <AppNavigator />
    </>
  );
}

registerRootComponent(App);
