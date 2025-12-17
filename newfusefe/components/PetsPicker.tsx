import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PETS_OPTIONS = [
  "None",
  "Cat",
  "Dog",
  "Cat and Dog",
  "Other",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function PetsPicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={PETS_OPTIONS}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.option}
            onPress={() => onChange(item)}
          >
            <Text style={styles.optionText}>{item}</Text>
            {value === item && (
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
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionText: {
    fontSize: 18,
  },
});
