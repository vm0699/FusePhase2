import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact & FAQ</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact Section */}
        <Text style={styles.sectionTitle}>📞 Contact Team</Text>
        {contacts.map((person, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleCall(person.phone)}
            style={styles.contactCard}
          >
            <Text style={styles.contactName}>{person.name}</Text>
            <Text style={styles.contactPhone}>{person.phone}</Text>
          </TouchableOpacity>
        ))}

        {/* FAQ Section (Optional) */}
        <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Q: How can I update my profile?</Text>
          <Text style={styles.faqAnswer}>
            A: Go to the profile tab, tap "Edit Profile", and make changes.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Q: I found a bug. What should I do?</Text>
          <Text style={styles.faqAnswer}>
            A: Please contact the team using the numbers above. We appreciate your feedback.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    paddingTop: 40,
    borderBottomColor: "#E5E7EB",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: "#111827",
  },
  contactCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  contactPhone: {
    fontSize: 14,
    color: "#3B82F6",
    marginTop: 4,
  },
  faqCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  faqAnswer: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
  },
});
