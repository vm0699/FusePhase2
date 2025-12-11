import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://172.20.10.4:5000';

export default function AuthGate({ navigation }) {
  useEffect(() => {
    const run = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        // Light-weight validation (protected endpoint)
        const res = await fetch(`${BASE_URL}/api/profile`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } else {
          await AsyncStorage.removeItem('jwtToken');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch {
        await AsyncStorage.removeItem('jwtToken');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };
    run();
  }, [navigation]);

  return (
    <View style={styles.c}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
