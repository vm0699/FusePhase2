import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRONOUN_OPTIONS = [
  "she/her",
  "he/him",
  "they/them",
  "Prefer not to say",
];

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function PronounsPicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your pronouns</Text>
      <Text style={styles.subtitle}>
        This helps others know how to address you.
      </Text>

      <FlatList
        data={PRONOUN_OPTIONS}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const selected = value === item;

          return (
            <TouchableOpacity
              style={styles.option}
              onPress={() => onChange(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
              {selected && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color="#6B21A8"
                />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionText: {
    fontSize: 18,
  },
});
