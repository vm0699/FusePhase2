import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const ethnicityOptions = [
  "Asian",
  "Black",
  "Latino / Hispanic",
  "Middle Eastern",
  "Native American",
  "Pacific Islander",
  "South Asian",
  "White",
  "Mixed",
  "Other",
  "Prefer not to say",
];

export default function EthnicityScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [selected, setSelected] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (route.params?.onSelect) route.params.onSelect(selected);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ethnicity</Text>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={ethnicityOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.option} onPress={() => setSelected(item)}>
            <Text style={styles.optionText}>{item}</Text>
            {selected === item && <Ionicons name="checkmark" size={20} color="#6B21A8" />}
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
  back: { color: "#6B21A8", fontWeight: "600" },
  done: { color: "#6B21A8", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold" },
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
