import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './AppNav';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { pushManager } from './app/notifications/pushManager';

export default function App() {
  useEffect(() => {
    pushManager.start();

    return () => {
      pushManager.stop();
    };
  }, []);

  return <AppNavigator />;
}

registerRootComponent(App);
