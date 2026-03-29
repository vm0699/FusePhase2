import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

interface NotificationOptionProps {
  title: string;
  description?: string;
  onPress?: () => void;
  isLast?: boolean;
}

const NotificationOption: React.FC<NotificationOptionProps> = ({
  title,
  description,
  onPress,
  isLast,
}) => {
  return (
    <TouchableOpacity
      style={[styles.optionButton, isLast && styles.optionButtonLast]}
      onPress={onPress}
    >
      <View style={styles.optionTextWrap}>
        <Text style={styles.optionText}>{title}</Text>
        {description ? (
          <Text style={styles.optionDescription}>{description}</Text>
        ) : null}
      </View>
      <View style={styles.chevronBubble}>
        <Icon name="chevron-right" size={16} color="#6B7280" />
      </View>
    </TouchableOpacity>
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
      <View style={styles.sectionCard}>
        {options.map((option, index) => (
          <NotificationOption
            key={index}
            {...option}
            isLast={index === options.length - 1}
          />
        ))}
      </View>
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
            "Turning this off means you may miss messages from your connections.",
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Choose how Fuse keeps in touch
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
  },
  headerSpacer: {
    width: 38,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionButtonLast: {
    borderBottomWidth: 0,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  optionText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  optionDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
    lineHeight: 20,
    fontFamily: "Poppins",
  },
  chevronBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
});
