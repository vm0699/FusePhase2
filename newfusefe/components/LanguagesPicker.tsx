import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const languageOptions = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Other",
];

interface Props {
  value: string[];
  onChange: (val: string[]) => void;
}

export default function LanguagesPicker({ value = [], onChange }: Props) {
  const toggleLanguage = (lang: string) => {
    if (value.includes(lang)) {
      onChange(value.filter((l) => l !== lang));
    } else {
      onChange([...value, lang]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Languages Spoken</Text>
      <Text style={styles.subtitle}>
        Select all languages you can speak
      </Text>

      <FlatList
        data={languageOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const selected = value.includes(item);
          return (
            <TouchableOpacity
              style={styles.option}
              onPress={() => toggleLanguage(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
              {selected && (
                <Ionicons name="checkmark" size={20} color="#6B21A8" />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionText: {
    fontSize: 18,
  },
});
