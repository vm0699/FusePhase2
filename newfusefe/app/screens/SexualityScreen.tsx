import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

type ParamList = {
  SexualityScreen: {
    currentValue?: string;
    onSelect?: (value: string) => void;
    mode?: "onboarding" | "edit";
  };
};

const sexualityOptions = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Asexual",
  "Pansexual",
  "Queer",
  "Prefer not to say",
];

export default function SexualityScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, "SexualityScreen">>();

  const isOnboarding = route.params?.mode === "onboarding";

  const [selected, setSelected] = useState(route.params?.currentValue || "");

  useEffect(() => {
    console.log("🟦 [Onboarding] SexualityScreen mounted | mode:", route.params?.mode);
  }, []);

  const handleDone = () => {
    if (route.params?.onSelect) {
      route.params.onSelect(selected);
    }

    // Only navigate back in edit-profile flow
    if (!isOnboarding) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header — hidden in onboarding */}
      {!isOnboarding && (
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

      {/* Title for onboarding */}
      {isOnboarding && (
        <View style={styles.onboardingTitleWrap}>
          <Text style={styles.title}>Sexuality</Text>
        </View>
      )}

      <FlatList
        data={sexualityOptions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.option}
            onPress={() => setSelected(item)}
          >
            <Text style={styles.optionText}>{item}</Text>
            {selected === item && (
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  onboardingTitleWrap: {
    padding: 16,
    paddingTop: 24,
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
