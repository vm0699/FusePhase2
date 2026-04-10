import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import OnboardingStepper from "../../components/OnboardingStepper";

const BASE_URL = "http://172.20.10.4:5000";

export default function LocationSetupScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Delivery address state
  const [address, setAddress] = useState({
    name: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    pincode: "",
  });

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔒 Basic validation
      if (!address.name || !address.line1 || !address.city || !address.pincode) {
        setError("Please fill all required address fields.");
        return;
      }

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

      // 3️⃣ Save to backend (LOCATION + DELIVERY ADDRESS)
      await fetch(`${BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: {
            location: { latitude, longitude },
            deliveryAddress: {
              name: address.name,
              line1: address.line1,
              line2: address.line2,
              landmark: address.landmark,
              city: address.city,
              pincode: address.pincode,
            },
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
      setError("Failed to save location and address. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingStepper currentStep={5} totalSteps={26} />
        <Text style={styles.title}>Where are{"\n"}you based?</Text>
        <Text style={styles.subtitle}>
          This address is used for gifts, surprises, and future features.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={address.name}
            onChangeText={(v) => setAddress({ ...address, name: v })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>ADDRESS LINE 1</Text>
          <TextInput
            placeholder="House / Flat / Building"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={address.line1}
            onChangeText={(v) => setAddress({ ...address, line1: v })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>ADDRESS LINE 2 (optional)</Text>
          <TextInput
            placeholder="Street / Area"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={address.line2}
            onChangeText={(v) => setAddress({ ...address, line2: v })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>LANDMARK (optional)</Text>
          <TextInput
            placeholder="Near..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={address.landmark}
            onChangeText={(v) => setAddress({ ...address, landmark: v })}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>CITY</Text>
            <TextInput
              placeholder="City"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={address.city}
              onChangeText={(v) => setAddress({ ...address, city: v })}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>PINCODE</Text>
            <TextInput
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              keyboardType="number-pad"
              value={address.pincode}
              onChangeText={(v) => setAddress({ ...address, pincode: v })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUseCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Use current location & continue
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingTop: 60,
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 44,
    fontWeight: '300',
    color: '#1a1a1a',
    fontFamily: 'Poppins',
    lineHeight: 52,
    marginTop: 16,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    fontFamily: 'Poppins',
    lineHeight: 22,
  },
  error: {
    color: '#dc2626',
    marginBottom: 16,
    fontFamily: 'Poppins',
    fontSize: 14,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    height: 56,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
  },
  button: {
    backgroundColor: '#ff5864',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});
