import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const pronounOptions = ["she/her", "he/him", "they/them", "Prefer not to say"];

export default function PronounsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  const isOnboarding = route.params?.mode === "onboarding";
  const onSelect = route.params?.onSelect;

  const [selected, setSelected] = useState<string>(
    route.params?.currentValue || ""
  );

  /* ---------------- UPDATE PROFILE (NON-ONBOARDING) ---------------- */
  const handleDone = () => {
    if (onSelect) onSelect(selected);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header only for Update Profile */}
      {!isOnboarding && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pronouns</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Onboarding title */}
      {isOnboarding && (
        <View style={styles.onboardingTitleWrap}>
          <Text style={styles.onboardingTitle}>Your pronouns</Text>
        </View>
      )}

      {/* Options */}
      <FlatList
        data={pronounOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.option}
            onPress={() => setSelected(item)}
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

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 96,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  back: { color: "#6B21A8", fontWeight: "600" },
  done: { color: "#6B21A8", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold" },

  onboardingTitleWrap: {
    padding: 20,
    paddingBottom: 10,
  },

  onboardingTitle: {
    fontSize: 24,
    fontWeight: "700",
  },

  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },

  optionText: { fontSize: 18 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },

  nextButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },

  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
