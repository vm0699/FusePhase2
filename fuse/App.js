import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './AppNav';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { pushManager } from './app/notifications/pushManager';
import { ensureAdsConsent } from './app/ads/adsConsent';

export default function App() {
  useEffect(() => {
    pushManager.start();
    void ensureAdsConsent();

    return () => {
      pushManager.stop();
    };
  }, []);

  return <AppNavigator />;
}

registerRootComponent(App);
