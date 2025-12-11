import React from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './AppNav'; // Your navigator file

export default function App() {
  return <AppNavigator />;
}

registerRootComponent(App);
