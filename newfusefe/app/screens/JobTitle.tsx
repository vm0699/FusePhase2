import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function JobScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [text, setText] = useState<string>(route.params?.currentValue || "");

  const handleDone = () => {
    if (route.params?.onSelect) route.params.onSelect(text);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>JobTitle</Text>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter your Job Title"
        value={text}
        onChangeText={setText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  back: { color: "#6B21A8", fontWeight: "600" },
  done: { color: "#6B21A8", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
