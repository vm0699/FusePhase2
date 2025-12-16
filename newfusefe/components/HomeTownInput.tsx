import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function HomeTownInput({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hometown</Text>
        <Text style={styles.subtitle}>Where are you originally from?</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter your hometown"
        value={value || ""}
        onChangeText={onChange}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
