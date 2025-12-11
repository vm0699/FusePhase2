import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const VideoAutoplaySettingsScreen = () => {
  const navigation = useNavigation();

  const handleGotIt = () => {
    navigation.navigate("Settings"); // ✅ goes directly to Settings page
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>How to Use Video Call</Text>

        <Text style={styles.instruction}>
          • Once your interests match with another user, a video call will start
          automatically.
        </Text>

        <Text style={styles.instruction}>
          • If no one is available right away, you’ll enter a “Waiting for Match” screen.
        </Text>

        <Text style={styles.instruction}>
          • You can tap “Next” anytime on the waiting screen to search for a new person.
        </Text>

        <Text style={styles.instruction}>
          • During the video call, use the controls to mute/unmute audio or turn video on/off.
        </Text>

        <Text style={styles.instruction}>
          • You can end the call at any time, and we’ll take you back to the waiting screen.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleGotIt}>
          <Text style={styles.buttonText}>Got It</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default VideoAutoplaySettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: {
    padding: 24,
    paddingBottom: 40,
    paddingTop: 60,
    justifyContent: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  instruction: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#e11d48",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
