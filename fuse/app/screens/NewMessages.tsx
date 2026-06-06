import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NewMessagesScreen = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>New messages</Text>
          <Text style={styles.subtitle}>Choose when Fuse notifies you</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Push notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: "#E5E7EB", true: "#ff9aa3" }}
            thumbColor={pushNotifications ? "#ff5864" : "#ffffff"}
          />
        </View>

        <View style={[styles.optionRow, styles.optionRowLast]}>
          <Text style={styles.optionLabel}>In-app notifications</Text>
          <Switch
            value={inAppNotifications}
            onValueChange={setInAppNotifications}
            trackColor={{ false: "#E5E7EB", true: "#ff9aa3" }}
            thumbColor={inAppNotifications ? "#ff5864" : "#ffffff"}
          />
        </View>
      </View>
    </View>
  );
};

export default NewMessagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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
  headerSpacer: {
    width: 38,
  },
  title: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionLabel: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
});
