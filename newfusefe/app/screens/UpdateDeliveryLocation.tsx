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

      if (!address.name || !address.line1 || !address.city || !address.pincode) {
        setError("Please fill all required address fields.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission is required.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log("Coordinates:", {
        latitude,
        longitude,
      });

      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return;

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

      navigation.goBack();
    } catch (err) {
      console.error("Failed:", err);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Delivery location</Text>
          <Text style={styles.headerSubtitle}>Address used for gifts and surprises</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formIntro}>
            Keep this up to date so future delivery-based features work properly.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            placeholder="Name"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={address.name}
            onChangeText={(v) => setAddress({ ...address, name: v })}
          />
          <TextInput
            placeholder="Address line 1"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={address.line1}
            onChangeText={(v) => setAddress({ ...address, line1: v })}
          />
          <TextInput
            placeholder="Address line 2 (optional)"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={address.line2}
            onChangeText={(v) => setAddress({ ...address, line2: v })}
          />
          <TextInput
            placeholder="Landmark (optional)"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={address.landmark}
            onChangeText={(v) => setAddress({ ...address, landmark: v })}
          />
          <TextInput
            placeholder="City"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={address.city}
            onChangeText={(v) => setAddress({ ...address, city: v })}
          />
          <TextInput
            placeholder="Pincode"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            keyboardType="number-pad"
            value={address.pincode}
            onChangeText={(v) => setAddress({ ...address, pincode: v })}
          />
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    marginTop: 2,
    textAlign: "center",
  },
  headerSpacer: {
    width: 38,
  },
  inner: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  formIntro: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    fontFamily: "Poppins",
    marginBottom: 16,
  },
  error: {
    color: "#DC2626",
    marginBottom: 14,
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    fontFamily: "Poppins",
  },
  button: {
    backgroundColor: "#ff5864",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
});
