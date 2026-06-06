import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

const VideoAutoplaySettingsScreen = () => {
  const navigation = useNavigation();

  const handleGotIt = () => {
    navigation.navigate("Settings");
  };

  const instructions = [
    "Once your interests match with another user, a video call can start automatically.",
    "If no one is available right away, you will enter a waiting for match screen.",
    "You can tap Next any time on the waiting screen to search for someone new.",
    "During the call, use the controls to mute audio or turn video on and off.",
    "You can end the call at any time and return to the waiting screen.",
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Video autoplay</Text>
          <Text style={styles.headerSubtitle}>How video matching works in Fuse</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to use video call</Text>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.instruction}>{instruction}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleGotIt}>
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default VideoAutoplaySettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff5864",
    marginTop: 8,
    marginRight: 12,
  },
  instruction: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    fontFamily: "Poppins",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#ff5864",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
});
