import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import ChildrenPicker from "../../components/ChildrenPicker";

export default function ChildrenScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [value, setValue] = useState<string>(
    route.params?.currentValue || ""
  );

  const handleDone = () => {
    if (route.params?.onSelect) {
      route.params.onSelect(value);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Children</Text>

        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Picker */}
      <ChildrenPicker value={value} onChange={setValue} />
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  back: { color: "#6B21A8", fontWeight: "600" },
  done: { color: "#6B21A8", fontWeight: "600" },
});
