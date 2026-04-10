import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileContext } from '../../ProfileContext';

const BASE_URL = "http://172.20.10.4:5000";

export default function GuidelinesPage() {
  const navigation = useNavigation();
  const { profileData, setFullProfile } = useContext(ProfileContext);

  const handleAccept = async () => {
    console.log("👉 [Guidelines] Starting profile submission…");
    try {
      const token = await AsyncStorage.getItem("jwtToken");

      if (!token) {
        Alert.alert("Error", "Session expired. Please login again.");
        navigation.reset({ index: 0, routes: [{ name: "PhoneVerif" }] });
        return;
      }

      const payload = {
        intro: profileData.intro,
        options: profileData.options,
        profileDetails: profileData.profileDetails,
        prompts: profileData.prompts,
        photos: profileData.photos,
      };

      const res = await fetch(`${BASE_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        Alert.alert("Error", json.message || "Failed to save profile.");
        return;
      }

      const { profile, accessToken, refreshToken } = json.data;
      setFullProfile(profile);

      if (accessToken) {
        await AsyncStorage.setItem("jwtToken", accessToken);
      }

      if (refreshToken) {
        await AsyncStorage.setItem("refreshToken", refreshToken);
      }

      // =====================================================
      // 🔥 2.1 FINAL BACKEND CHECKPOINT — ONBOARDING COMPLETE
      // =====================================================
      await fetch(`${BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: {
            onboardingStage: "COMPLETE", // ✅ FINAL STATE
          },
        }),
      });
      // =====================================================

      navigation.reset({
        index: 0,
        routes: [{ name: "SwipeView" }],
      });
    } catch (err) {
      console.error("🔥 Error in Guidelines handleAccept:", err);
      Alert.alert("Error", "Unexpected error occurred.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>It's cool to be kind</Text>

          <Text style={styles.paragraph}>
            We're all about equality in relationships. Here, we hold people accountable
            for the way they treat each other.
          </Text>

          <Text style={styles.paragraph}>
            We ask everyone on Fuse to be kind and respectful, so every person can
            have a great experience.
          </Text>

          <Text style={styles.paragraph}>
            By using Fuse, you're agreeing to adhere to our values as well as our{' '}
            <Text style={styles.linkText}>guidelines</Text>.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAccept}>
          <Text style={styles.buttonText}>I accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff5864',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  textContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#fff',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
