import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather"; // Using Feather icons

export default function SecuritySettings() {
  const navigation = useNavigation();
  const [isFaceIdEnabled, setIsFaceIdEnabled] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Manage how you can safely and securely log in.
        </Text>

        {/* Login Methods */}
        <TouchableOpacity style={styles.optionButton}>
          <Text style={styles.optionText}>Ways you can log in</Text>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        {/* Face ID Toggle */}
        <View style={styles.switchContainer}>
          <Text style={styles.optionText}>Face ID</Text>
          <Switch
            value={isFaceIdEnabled}
            onValueChange={setIsFaceIdEnabled}
          />
        </View>
        <Text style={styles.subText}>Enable Face ID to log in faster.</Text>

        {/* Privacy Settings */}
        <Text style={styles.sectionTitle}>Privacy settings</Text>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate("Privacy Settings")}
        >
          <Text style={styles.optionText}>Privacy settings</Text>
          <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
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
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    paddingTop: 40,
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
  scrollContent: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  switchContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    marginBottom: 10,
  },
});
