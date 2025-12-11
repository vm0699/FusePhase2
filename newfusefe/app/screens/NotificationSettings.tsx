import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather"; // Using Feather Icons for consistency

interface NotificationOptionProps {
  title: string;
  description?: string;
  onPress?: () => void;
}

const NotificationOption: React.FC<NotificationOptionProps> = ({
  title,
  description,
  onPress,
}) => {
  return (
    <View style={styles.optionContainer}>
      <TouchableOpacity style={styles.optionButton} onPress={onPress}>
        <Text style={styles.optionText}>{title}</Text>
        <Icon name="chevron-right" size={20} color="#999" />
      </TouchableOpacity>
      {description && (
        <Text style={styles.optionDescription}>{description}</Text>
      )}
    </View>
  );
};

interface NotificationSectionProps {
  title: string;
  options: Array<{
    title: string;
    description?: string;
    onPress?: () => void;
  }>;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  options,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {options.map((option, index) => (
        <NotificationOption key={index} {...option} />
      ))}
    </View>
  );
};

export default function NotificationSettings() {
  const navigation = useNavigation();

  const sections = [
    {
      title: "Message notifications",
      options: [
        {
          title: "New messages",
          description:
            "Turning off this notification means you will miss out on new messages from your connections.",
          onPress: () => navigation.navigate("New Messages"),
        },
      ],
    },
    {
      title: "Match notifications",
      options: [
        {
          title: "New admirers",
          onPress: () => navigation.navigate("New Admirers"),
        },
        {
          title: "New matches",
          onPress: () => navigation.navigate("New Matches"),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.description}>
          Choose how you'd like us to keep in touch.
        </Text>

        {sections.map((section, index) => (
          <NotificationSection
            key={index}
            title={section.title}
            options={section.options}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Light gray background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    paddingTop:40,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    marginBottom: 10,
  },
  optionContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "column",
    elevation: 2, // Shadow for Android
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  optionDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
});
