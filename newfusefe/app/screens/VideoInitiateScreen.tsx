import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import { PermissionsAndroid } from "react-native";
import { BottomNav } from "../../components/BottomNav";

export default function VideoInitiateScreen() {
  const [interests, setInterests] = useState("");
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("jwtToken");
        if (storedToken) {
          // Redacted: avoid printing token value
          console.log("✅ JWT token available");
          setJwtToken(storedToken);
        } else {
          console.warn("⚠️ No JWT found, navigating to login");
          navigation.navigate("LoginScreen");
        }
      } catch (err) {
        console.error("❌ Error fetching token:", err);
      }
    };
    fetchUserId();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (Platform.OS === "android") {
        const audioPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return (
          status === "granted" &&
          audioPermission === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      return status === "granted";
    } catch (err) {
      console.error("❌ Permission request error:", err);
      return false;
    }
  };

  const extractUserIdFromJwt = (token: string): string | null => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded?.id ?? null;
    } catch (err) {
      console.error("❌ Failed to decode JWT:", err);
      return null;
    }
  };

  const handleStartCall = async () => {
    try {
      const trimmed = interests.trim();
      if (!trimmed || !jwtToken) {
        Alert.alert("Error", "Please enter interests and ensure you're logged in.");
        return;
      }

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          "Permission Denied",
          "Camera and Microphone access are required to start a video call."
        );
        return;
      }

      const interestsArray = trimmed
        .toLowerCase()
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const userId = extractUserIdFromJwt(jwtToken);
      if (!userId) {
        Alert.alert("Error", "Failed to extract user ID.");
        return;
      }

      // Redacted: avoid logging userId or interests
      navigation.navigate("WaitingScreen", {
        userId,
        interests: interestsArray,
      });
    } catch (err) {
      console.error("❌ handleStartCall error:", err);
      Alert.alert("Unexpected Error", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.heading}>Enter Interests</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g., movies, fitness, travel"
            placeholderTextColor="#000"
            value={interests}
            onChangeText={setInterests}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />

          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartCall}>
              <Text style={styles.startButtonText}>Start Video Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomNavWrapper}>
            <BottomNav />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  buttonWrapper: {
    marginBottom: 60,
  },
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  startButton: {
    backgroundColor: '#ff5864',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
