import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function EduLevelScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const isOnboarding = route.params?.mode === "onboarding";

  const [text, setText] = useState<string>(
    route.params?.currentValue || ""
  );

  const handleChange = (value: string) => {
    setText(value);

    // 🔥 Live update during onboarding
    if (isOnboarding && route.params?.onSelect) {
      route.params.onSelect(value);
    }
  };

  const handleDone = () => {
    if (route.params?.onSelect) {
      route.params.onSelect(text);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header for Update Profile flow */}
      {!isOnboarding && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Education Level</Text>

          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Onboarding header */}
      {isOnboarding && (
        <View style={styles.onboardingHeader}>
          <Text style={styles.title}>Education</Text>
          <Text style={styles.subtitle}>
            What’s your highest level of education?
          </Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter your education level"
        value={text}
        onChangeText={handleChange}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  onboardingHeader: {
    marginBottom: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
  },

  back: { color: "#6B21A8", fontWeight: "600" },
  done: { color: "#6B21A8", fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
