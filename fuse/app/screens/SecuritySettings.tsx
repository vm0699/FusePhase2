import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

export default function SecuritySettings() {
  const navigation = useNavigation();
  const [isFaceIdEnabled, setIsFaceIdEnabled] = React.useState(false);

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
          <Text style={styles.headerTitle}>Security</Text>
          <Text style={styles.headerSubtitle}>
            Login methods and privacy controls
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Login methods</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionText}>Ways you can log in</Text>
            <View style={styles.chevronBubble}>
              <Icon name="chevron-right" size={16} color="#6B7280" />
            </View>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.optionText}>Face ID</Text>
              <Text style={styles.subText}>Enable Face ID to log in faster.</Text>
            </View>
            <Switch
              value={isFaceIdEnabled}
              onValueChange={setIsFaceIdEnabled}
              trackColor={{ false: "#E5E7EB", true: "#ff9aa3" }}
              thumbColor={isFaceIdEnabled ? "#ff5864" : "#ffffff"}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Privacy settings</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={[styles.optionButton, styles.optionButtonLast]}
            onPress={() => navigation.navigate("Privacy Settings")}
          >
            <Text style={styles.optionText}>Privacy settings</Text>
            <View style={styles.chevronBubble}>
              <Icon name="chevron-right" size={16} color="#6B7280" />
            </View>
          </TouchableOpacity>
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
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
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
  optionText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  switchCopy: {
    flex: 1,
    paddingRight: 12,
  },
  subText: {
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
