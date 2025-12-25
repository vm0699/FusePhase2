import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { authClient } from '../auth/authClient';
import { authedFetch } from '../auth/apiClient';

const BASE_URL = 'http://172.20.10.4:5000';

export default function AuthGate({ navigation }) {
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        console.log('🟣 [AuthGate] BOOTSTRAP START');

        /**
         * 1️⃣ Silent auth bootstrap
         * - checks access token hi
         * - refreshes if expired
         * - fails ONLY if refresh token missing/invalid
         */
        const boot = await authClient.bootstrap();

if (!boot.ok) {
  console.log(
    '🟥 [AuthGate] BOOTSTRAP FAILED → Login',
    'reason' in boot ? boot.reason : 'unknown'
  );

  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
  return;
}


        console.log('🟢 [AuthGate] BOOTSTRAP OK → fetching profile');

        /**
         * 2️⃣ Fetch profile using authedFetch
         * - token already valid here
         */
        const res = await authedFetch({
          input: `${BASE_URL}/api/profile`,
          init: { method: 'GET' },
        });

        console.log('🟣 [AuthGate] /profile status:', res.status);

        /**
         * 3️⃣ Handle profile fetch failures safely
         */
        if (!res.ok) {
          // Auth failure AFTER refresh attempt → real logout
          if (res.status === 401 || res.status === 403) {
            console.log('🟥 [AuthGate] AUTH FAILED AFTER REFRESH → Login');
            await authClient.logoutLocal();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
            return;
          }

          // Transient backend/network issue → do NOT logout
          console.log('🟠 [AuthGate] PROFILE FETCH FAILED (non-auth) → stay loading');
          return;
        }

        const json = await res.json();
        const onboardingStage = json?.data?.onboardingStage;

        console.log('🟣 [AuthGate] onboardingStage:', onboardingStage);

        /**
         * 4️⃣ Routing logic (UNCHANGED)
         */
        let nextRoute = 'Login';

        switch (onboardingStage) {
          case 'PHONE_VERIFIED':
            nextRoute = 'Intro';
            break;
          case 'INTRO_DONE':
            nextRoute = 'ProfileSetup';
            break;
          case 'PROFILE_SETUP_DONE':
            nextRoute = 'LocationSetup';
            break;
          case 'LOCATION_DONE':
            nextRoute = 'OnboardingOptional';
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
            nextRoute = 'Intro';
        }

        if (!isMounted) return;

        console.log('🟢 [AuthGate] NAVIGATE →', nextRoute);

        navigation.reset({
          index: 0,
          routes: [{ name: nextRoute }],
        });
      } catch (err) {
        console.error('❌ [AuthGate] FATAL ERROR', err);

        // Only fatal auth errors reach here
        await authClient.logoutLocal();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    run();

    return () => {
      isMounted = false;
    };
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
