import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const religionOptions = [
  "Hindu",
  "Christian",
  "Muslim",
  "Jain",
  "Sikh",
  "Buddhist",
  "Atheist",
  "Spiritual",
  "Other",
];

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function ReligionPicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Religious beliefs</Text>
        <Text style={styles.subtitle}>
          What best describes your beliefs?
        </Text>
      </View>

      <FlatList
        data={religionOptions}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 20,
    paddingBottom: 10,
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
