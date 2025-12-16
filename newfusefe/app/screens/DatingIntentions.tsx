import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const datingOptions = [
  "Long-term relationship",
  "Short-term relationship",
  "New friends",
  "Open to exploring",
  "Marriage",
  "Not sure yet",
];

export default function DatingIntentionsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const isOnboarding = route.params?.mode === "onboarding";

  const [selected, setSelected] = useState<string>(
    route.params?.currentValue || ""
  );

  const handleSelect = (value: string) => {
    setSelected(value);

    // 🔥 IMPORTANT: notify wrapper immediately
    if (route.params?.onSelect) {
      route.params.onSelect(value);
    }
  };

  const handleDone = () => {
    if (route.params?.onSelect) {
      route.params.onSelect(selected);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header only for Update Profile mode */}
      {!isOnboarding && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Dating Intentions</Text>

          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Title for onboarding */}
      {isOnboarding && (
        <View style={styles.onboardingHeader}>
          <Text style={styles.title}>Dating Intentions</Text>
          <Text style={styles.subtitle}>
            What are you looking for right now?
          </Text>
        </View>
      )}

      <FlatList
        data={datingOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleSelect(item)}
          >
            <Text style={styles.optionText}>{item}</Text>
            {selected === item && (
              <Ionicons name="checkmark" size={20} color="#6B21A8" />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  onboardingHeader: {
    padding: 20,
    paddingBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
  },

  back: { color: "#6B21A8", fontWeight: "600" },
  done: { color: "#6B21A8", fontWeight: "600" },

  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },

  optionText: { fontSize: 18 },
});
