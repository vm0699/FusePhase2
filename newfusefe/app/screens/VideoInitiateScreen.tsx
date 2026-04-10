import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import { PermissionsAndroid } from "react-native";
import { BottomNav } from "../../components/BottomNav";
import Icon from "react-native-vector-icons/Feather";

export default function VideoInitiateScreen() {
  const [interests, setInterests] = useState("");
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
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
          navigation.navigate("Login");
        }
      } catch (err) {
        console.error("❌ Error fetching token:", err);
      }
    };
    fetchUserId();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setStartingCall(false);
    }, [])
  );

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
      if (startingCall) return;
      const trimmed = interests.trim();
      if (!trimmed || !jwtToken) {
        Alert.alert("Error", "Please enter interests and ensure you're logged in.");
        return;
      }

      setStartingCall(true);

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          "Permission Denied",
          "Camera and Microphone access are required to start a video call."
        );
        setStartingCall(false);
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
        setStartingCall(false);
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
      setStartingCall(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.bgOrbOne} />
          <View style={styles.bgOrbTwo} />

          <View style={styles.centerWrap}>
            <View style={styles.visualRow}>
              <View style={styles.visualDot}>
                <Icon name="video" size={16} color="#ff5864" />
              </View>
              <View style={styles.visualDot}>
                <Icon name="camera" size={16} color="#ff5864" />
              </View>
              <View style={styles.visualDot}>
                <Icon name="heart" size={16} color="#ff5864" />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.heading}>Video Call</Text>
              <Text style={styles.subHeading}>Set your interests to find the right match</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>Enter interests</Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., movies, fitness, travel"
                placeholderTextColor="#9CA3AF"
                value={interests}
                onChangeText={setInterests}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />

              <Text style={styles.helperText}>
                Use commas to add multiple interests for better matching.
              </Text>

              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={[styles.startButton, startingCall && { opacity: 0.6 }]}
                  onPress={handleStartCall}
                  disabled={startingCall}
                >
                  <Text style={styles.startButtonText}>
                    {startingCall ? "Starting..." : "Start Video Call"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingHorizontal: 16,
    backgroundColor: "#FAF8F3",
    overflow: "hidden",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 66,
  },
  bgOrbOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFF0F2",
    top: -40,
    left: -50,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFE4E8",
    bottom: 120,
    right: -40,
  },
  visualRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 14,
    gap: 10,
  },
  visualDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  header: {
    paddingTop: 0,
    paddingBottom: 12,
    alignItems: "center",
  },
  heading: {
    fontSize: 26,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  subHeading: {
    marginTop: 2,
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    textAlign: "center",
  },
  formCard: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-Bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
    fontSize: 15,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    fontFamily: "Poppins",
    minHeight: 88,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins",
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonWrapper: {
    marginBottom: 2,
  },
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  startButton: {
    backgroundColor: "#ff5864",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
});
