import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import PronounsPicker from "../components/PronounsPicker"; // 🔥 example

const BASE_URL = "http://172.20.10.4:5000";

/**
 * Optional onboarding steps (ORDER MATTERS)
 * Each step defines:
 * - key (backend field)
 * - component (NOT screen)
 */
const OPTIONAL_ONBOARDING_STEPS = [
  {
    key: "pronouns",
    Component: PronounsPicker,
  },
  // next components will come here
];

const STORAGE_KEY_PREFIX = "onboarding_optional_progress";

export default function OnboardingOptionalWrapper() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [value, setValue] = useState<any>(null);

  /* ---------------- LOAD SAVED PROGRESS ---------------- */

  useEffect(() => {
    const load = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) return;

        const raw = await AsyncStorage.getItem(
          `${STORAGE_KEY_PREFIX}:${userId}`
        );

        if (raw) {
          const parsed = JSON.parse(raw);
          setCurrentIndex(parsed.currentIndex ?? 0);
          setCompletedKeys(parsed.completed ?? []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- SAVE PROGRESS ---------------- */

  const persist = async (nextIndex: number, nextCompleted: string[]) => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return;

    await AsyncStorage.setItem(
      `${STORAGE_KEY_PREFIX}:${userId}`,
      JSON.stringify({
        currentIndex: nextIndex,
        completed: nextCompleted,
      })
    );
  };

  /* ---------------- NEXT / SKIP ---------------- */

  const handleNext = async (save: boolean) => {
    const step = OPTIONAL_ONBOARDING_STEPS[currentIndex];
    if (!step) return;

    if (save && value !== null) {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        await fetch(`${BASE_URL}/api/profile/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            updates: {
              [step.key]: value,
            },
          }),
        });
      }
    }

    const nextCompleted = save
      ? [...new Set([...completedKeys, step.key])]
      : completedKeys;

    const nextIndex = currentIndex + 1;

    setValue(null);
    setCompletedKeys(nextCompleted);
    setCurrentIndex(nextIndex);

    await persist(nextIndex, nextCompleted);

    if (nextIndex >= OPTIONAL_ONBOARDING_STEPS.length) {
      navigation.reset({
        index: 0,
        routes: [{ name: "ProfileDetails" }],
      });
    }
  };

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const StepComponent = OPTIONAL_ONBOARDING_STEPS[currentIndex]?.Component;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {StepComponent && (
          <StepComponent value={value} onChange={setValue} />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => handleNext(false)}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => handleNext(true)}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  skip: {
    fontSize: 16,
    color: "#666",
  },
  nextButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  nextText: {
    color: "#fff",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
