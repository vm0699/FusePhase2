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
import Icon from "react-native-vector-icons/Feather";

const BASE_URL = "http://172.20.10.4:5000";

export default function UpdateDeliveryLocation() {
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

  const handleSaveLocation = async () => {
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

      console.log("📍 [UpdateDeliveryLocation] Coordinates:", {
        latitude,
        longitude,
      });

      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return;

      // 3️⃣ Save to backend
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
          },
        }),
      });

      // 4️⃣ Back to Settings
      navigation.goBack();
    } catch (err) {
      console.error("❌ [UpdateDeliveryLocation] Failed:", err);
      setError("Failed to update delivery address. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={26} color="#007aff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Location</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.subtitle}>
          Update the address used for gifts, surprises, and future features.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Address Fields */}
        <TextInput
          placeholder="Name"
          style={styles.input}
          value={address.name}
          onChangeText={(v) => setAddress({ ...address, name: v })}
        />
        <TextInput
          placeholder="Address line 1"
          style={styles.input}
          value={address.line1}
          onChangeText={(v) => setAddress({ ...address, line1: v })}
        />
        <TextInput
          placeholder="Address line 2 (optional)"
          style={styles.input}
          value={address.line2}
          onChangeText={(v) => setAddress({ ...address, line2: v })}
        />
        <TextInput
          placeholder="Landmark (optional)"
          style={styles.input}
          value={address.landmark}
          onChangeText={(v) => setAddress({ ...address, landmark: v })}
        />
        <TextInput
          placeholder="City"
          style={styles.input}
          value={address.city}
          onChangeText={(v) => setAddress({ ...address, city: v })}
        />
        <TextInput
          placeholder="Pincode"
          style={styles.input}
          keyboardType="number-pad"
          value={address.pincode}
          onChangeText={(v) => setAddress({ ...address, pincode: v })}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSaveLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save location</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  inner: {
    padding: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },
  error: {
    color: "#dc2626",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#e11d48",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
