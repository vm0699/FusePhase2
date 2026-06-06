import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

export default function ContactFAQScreen() {
  const navigation = useNavigation();

  const contacts = [
    { name: "Ashwath Sai", phone: "+91 8667478669" },
    { name: "Vignesh", phone: "+91 9498071974" },
  ];

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Contact & FAQ</Text>
          <Text style={styles.headerSubtitle}>Reach the team or review common questions</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Contact team</Text>
        {contacts.map((person, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleCall(person.phone)}
            style={styles.contactCard}
          >
            <View>
              <Text style={styles.contactName}>{person.name}</Text>
              <Text style={styles.contactPhone}>{person.phone}</Text>
            </View>
            <View style={styles.chevronBubble}>
              <Icon name="phone-call" size={15} color="#ff5864" />
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Frequently asked questions</Text>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How can I update my profile?</Text>
          <Text style={styles.faqAnswer}>
            Go to the profile tab, tap Edit Profile, and make your changes there.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>I found a bug. What should I do?</Text>
          <Text style={styles.faqAnswer}>
            Contact the team using the numbers above and share what happened.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginTop: 6,
    marginBottom: 10,
  },
  contactCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactName: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  contactPhone: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "Poppins",
  },
  faqCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  faqQuestion: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    fontFamily: "Poppins",
  },
  chevronBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
  },
});
