import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://172.20.10.4:5000';

export default function AuthGate({ navigation }) {
useEffect(() => {
  const run = async () => {
    try {
      console.log('🟣 [AuthGate] START');

      const token = await AsyncStorage.getItem('jwtToken');
      console.log('🟣 [AuthGate] jwtToken from storage:', token);

      // ❌ No token → Login
      if (!token) {
        console.log('🟥 [AuthGate] NO TOKEN → redirecting to Login');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      console.log('🟣 [AuthGate] Calling GET /api/profile/me');

      // 🔍 Validate token & fetch user profile
      const res = await fetch(`${BASE_URL}/api/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🟣 [AuthGate] /profile/me response status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.log('🟥 [AuthGate] Profile fetch failed:', errText);

        await AsyncStorage.removeItem('jwtToken');
        console.log('🟥 [AuthGate] jwtToken removed, redirecting to Login');

        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const json = await res.json();
      console.log('🟣 [AuthGate] Profile response JSON:', json);

      const onboardingStage = json?.data?.onboardingStage;
      console.log('🟣 [AuthGate] onboardingStage:', onboardingStage);

      // 🚦 Route strictly based on backend checkpoint
      let nextRoute = 'Login';

      switch (onboardingStage) {
        case 'PHONE_VERIFIED':
          nextRoute = 'Intro';
          break;

        case 'INTRO_DONE':
          nextRoute = 'ProfileSetup';
          break;

        case 'PROFILE_SETUP_DONE':
          nextRoute = 'ProfileDetails';
          break;

        case 'DETAILS_DONE':
          nextRoute = 'PromptSelection';
          break;

        case 'PROMPTS_DONE':
          nextRoute = 'PhotoUpload';
          break;

        case 'PHOTOS_DONE':
          nextRoute = 'Guidelines';
          break;

        case 'COMPLETE':
          nextRoute = 'MainTabs';
          break;

        default:
          console.log(
            '🟠 [AuthGate] UNKNOWN onboardingStage, defaulting to Intro'
          );
          nextRoute = 'Intro';
      }

      console.log('🟢 [AuthGate] Navigating to:', nextRoute);

      navigation.reset({
        index: 0,
        routes: [{ name: nextRoute }],
      });
    } catch (error) {
      console.error('❌ [AuthGate] ERROR:', error);

      await AsyncStorage.removeItem('jwtToken');
      console.log('🟥 [AuthGate] Error → jwtToken removed → Login');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  run();
}, [navigation]);


  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
