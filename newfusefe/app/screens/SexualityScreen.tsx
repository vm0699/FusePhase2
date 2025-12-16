import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import SexualityPicker from "../../components/SexualityPicker"; // adjust path if needed

export default function SexualityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const mode: "onboarding" | "edit" = route.params?.mode ?? "edit";
  const initialValue = route.params?.currentValue ?? "";
  const onChangeFromEdit = route.params?.onChange;

  const [value, setValue] = useState<string>(initialValue);

  const handleDone = () => {
    if (onChangeFromEdit) {
      onChangeFromEdit(value);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {mode === "edit" && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Sexuality</Text>

          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <SexualityPicker value={value} onChange={setValue} />
    </View>
  );
}

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
