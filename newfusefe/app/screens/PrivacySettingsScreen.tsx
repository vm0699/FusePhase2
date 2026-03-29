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

const PrivacySettingsScreen = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.navigate("Settings");
  };

  const paragraphs = [
    "At Fuse, your privacy and safety are core product requirements, not an afterthought.",
    "Personal data like photos, interests, and preferences is encrypted and securely stored.",
    "Your profile is shown based on compatibility and intent, not random exposure.",
    "Video calls are temporary and not recorded. Chats are only visible after mutual acceptance.",
    "Your information is never sold or shared without your explicit consent.",
    "You can request profile deletion at any time and your data will be removed permanently.",
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Privacy & security</Text>
          <Text style={styles.headerSubtitle}>How Fuse protects your data</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {paragraphs.map((paragraph, index) => (
            <View key={index} style={styles.paragraphRow}>
              <View style={styles.dot} />
              <Text style={styles.paragraph}>{paragraph}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>Back to settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PrivacySettingsScreen;

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
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  paragraphRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff5864",
    marginTop: 8,
    marginRight: 12,
  },
  paragraph: {
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
