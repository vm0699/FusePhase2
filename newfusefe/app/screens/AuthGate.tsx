import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { authClient } from '../auth/authClient';
import { authedFetch } from '../auth/apiClient';

const BASE_URL = 'http://172.20.10.4:5000';

export default function AuthGate({ navigation }) {
  const [transientError, setTransientError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      setTransientError(null);

      try {
        console.log('ðŸŸ£ [AuthGate] BOOTSTRAP START');

        /**
         * 1ï¸âƒ£ Silent auth bootstrap
         * - checks access token hi
         * - refreshes if expired
         * - fails ONLY if refresh token missing/invalid
         */
        const boot = await authClient.bootstrap();

        if (!boot.ok) {
          console.log(
            'ðŸŸ¥ [AuthGate] BOOTSTRAP FAILED â†’ Login',
            'reason' in boot ? boot.reason : 'unknown'
          );

          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        console.log('ðŸŸ¢ [AuthGate] BOOTSTRAP OK â†’ fetching profile');

        /**
         * 2ï¸âƒ£ Fetch profile using authedFetch
         * - token already valid here
         */
        const res = await authedFetch({
          input: `${BASE_URL}/api/profile`,
          init: { method: 'GET' },
        });

        console.log('ðŸŸ£ [AuthGate] /profile status:', res.status);

        /**
         * 3ï¸âƒ£ Handle profile fetch failures safely
         */
        if (!res.ok) {
          // Auth failure AFTER refresh attempt â†’ real logout
          if (res.status === 401 || res.status === 403) {
            console.log('ðŸŸ¥ [AuthGate] AUTH FAILED AFTER REFRESH â†’ Login');
            await authClient.logoutLocal();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
            return;
          }

          // User not found in DB (cleared data / deleted account) â†’ logout + Login
          if (res.status === 404) {
            console.log('ðŸŸ¥ [AuthGate] USER NOT FOUND IN DB â†’ Login');
            await authClient.logoutLocal();
            if (!isMounted) return;
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            return;
          }

          // Transient backend/network issue (5xx) â†’ show retry UI instead of hanging forever
          console.log('ðŸŸ  [AuthGate] PROFILE FETCH FAILED (transient) â†’ show retry');
          if (!isMounted) return;
          setTransientError('We could not reach the server. Please try again.');
          return;
        }

        const json = await res.json();
        const onboardingStage = json?.data?.onboardingStage;

        console.log('ðŸŸ£ [AuthGate] onboardingStage:', onboardingStage);

        /**
         * 4ï¸âƒ£ Routing logic (UNCHANGED)
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

        console.log('ðŸŸ¢ [AuthGate] NAVIGATE â†’', nextRoute);

        navigation.reset({
          index: 0,
          routes: [{ name: nextRoute }],
        });
      } catch (err) {
        console.error(' [AuthGate] FATAL ERROR', err);

        // Only fatal auth errors reach here
        await authClient.logoutLocal();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      {transientError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Connection issue</Text>
          <Text style={styles.errorText}>{transientError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.replace('AuthGate')}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ActivityIndicator size="large" />
      )}
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
  errorWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    color: '#1a1a1a',
    fontFamily: 'Poppins-Bold',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: '#ff5864',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
});
