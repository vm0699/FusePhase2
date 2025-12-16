import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import JobTitleInput from "../../components/JobTitleInput";

export default function JobScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const isOnboarding = route.params?.mode === "onboarding";
  const onSelect = route.params?.onSelect;

  const [value, setValue] = useState<string>(
    route.params?.currentValue || ""
  );

  const handleDone = () => {
    if (onSelect) onSelect(value);
    navigation.goBack();
  };

  // 🔥 Onboarding → wrapper controls footer & navigation
  if (isOnboarding) {
    return <JobTitleInput value={value} onChange={setValue} />;
  }

  // 🔁 Update Profile flow
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Job Title</Text>

        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.done}>Done</Text>
        </TouchableOpacity>
      </View>

      <JobTitleInput value={value} onChange={setValue} />
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
});
