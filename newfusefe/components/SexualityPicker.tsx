import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const OPTIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Queer",
  "Prefer not to say",
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function SexualityPicker({ value, onChange }: Props) {
  return (
    <View>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Your sexuality</Text>
      </View>

      {OPTIONS.map((item) => (
        <TouchableOpacity
          key={item}
          style={styles.option}
          onPress={() => onChange(item)}
        >
          <Text style={styles.optionText}>{item}</Text>
          {value === item && (
            <Ionicons name="checkmark" size={20} color="#6B21A8" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
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
  optionText: {
    fontSize: 18,
  },
});
