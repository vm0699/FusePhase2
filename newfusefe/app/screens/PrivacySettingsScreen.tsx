import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const PrivacySettingsScreen = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.navigate("Settings"); // ✅ Back to Settings page
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Privacy & Security</Text>

        <Text style={styles.paragraph}>
          At Fuse, your privacy and safety are our highest priorities. We’ve built our features with transparency, consent, and security at the core.
        </Text>

        <Text style={styles.paragraph}>
          • All personal data (like photos, interests, and preferences) is encrypted and securely stored.
        </Text>

        <Text style={styles.paragraph}>
          • Your profile is only shown to users based on mutual interest or compatibility — never randomly exposed.
        </Text>

        <Text style={styles.paragraph}>
          • Video calls are temporary and not recorded. Chats are visible only after mutual acceptance and are end-to-end secured.
        </Text>

        <Text style={styles.paragraph}>
          • We never sell or share your information with third parties without your explicit consent.
        </Text>

        <Text style={styles.paragraph}>
          • You can request profile deletion at any time, and we will erase your data permanently.
        </Text>

        <Text style={styles.paragraph}>
          By using Fuse, you trust us with your experience. And we promise to honor that trust — always.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PrivacySettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: {
    padding: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  paragraph: {
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
