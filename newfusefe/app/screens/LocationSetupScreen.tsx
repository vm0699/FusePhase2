import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "http://172.20.10.4:5000";

export default function LocationSetupScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1️⃣ Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission is required.");
        return;
      }

      // 2️⃣ Get coordinates
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log("📍 [LocationSetup] Coordinates:", {
        latitude,
        longitude,
      });

      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return;

      // 3️⃣ Save to backend (CORRECT FORMAT)
      await fetch(`${BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: {
            location: { latitude, longitude },
            onboardingStage: "LOCATION_DONE",
          },
        }),
      });

      // 4️⃣ Move to optional onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: "OnboardingOptional" }],
      });
    } catch (err) {
      console.error("❌ [LocationSetup] Failed:", err);
      setError("Failed to get your location. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Location</Text>
        <Text style={styles.subtitle}>
          Only your neighbourhood will be shown on your profile.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleUseCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Use current location</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  error: {
    color: "#dc2626",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#e11d48",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
