import React from 'react';
import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './AppNav'; // Your navigator file

// Enables native-backed screen transitions (react-native-screens) instead of
// plain Views — this is what makes push/pop feel native-smooth instead of janky.
enableScreens();

export default function App() {
  return <AppNavigator />;
}

registerRootComponent(App);