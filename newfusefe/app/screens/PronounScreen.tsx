import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import PronounsPicker from "../../components/PronounsPicker"; // adjust path if needed

export default function PronounsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" = route.params?.mode ?? "edit";

  const initialValue = route.params?.currentValue ?? "";
  const onChangeFromEdit = route.params?.onChange; // ONLY for update profile

  const [value, setValue] = useState<string>(initialValue);

  /* ---------------- UPDATE PROFILE FLOW ---------------- */
  const handleDone = () => {
    if (onChangeFromEdit) {
      onChangeFromEdit(value);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header ONLY for Update Profile */}
      {mode === "edit" && (
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

      {/* Shared picker UI */}
      <PronounsPicker value={value} onChange={setValue} />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  back: {
    color: "#6B21A8",
    fontWeight: "600",
  },

  done: {
    color: "#6B21A8",
    fontWeight: "600",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
