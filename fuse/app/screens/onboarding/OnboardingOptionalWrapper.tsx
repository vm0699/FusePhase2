import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import PronounsPicker from "../../../components/PronounsPicker";
import SexualityPicker from "../../../components/SexualityPicker";
import DatingIntentionsPicker from "../../../components/DatingIntentionsPicker";
import PoliticsPicker from "../../../components/PoliticsPicker";
import ReligionPicker from "../../../components/ReligionPicker";
import WorkInput from "../../../components/WorkInput";
import JobTitleInput from "../../../components/JobTitleInput";
import EduLevelInput from "../../../components/EduLevelInput";
import CollegeInput from "../../../components/CollegeInput";
import HomeTownInput from "../../../components/HomeTownInput";
import LanguagesPicker from "../../../components/LanguagesPicker";
import EthnicityPicker from "../../../components/EthnicityPicker";
import ChildrenPicker from "../../../components/ChildrenPicker";
import PetsPicker from "../../../components/PetsPicker";
import ZodiacPicker from "../../../components/ZodiacPicker";
import DrinkingPicker from "../../../components/DrinkingPicker";
import SmokingPicker from "../../../components/SmokingPicker";
import MarijuanaPicker from "../../../components/MarijuanaPicker";
import { API_BASE_URL } from "../../config/env";
import DrugsPicker from "../../../components/DrugsPicker";

const BASE_URL = API_BASE_URL;

const OPTIONAL_ONBOARDING_STEPS = [
  { key: "pronouns", Component: PronounsPicker },
  { key: "sexuality", Component: SexualityPicker },
  { key: "datingIntentions", Component: DatingIntentionsPicker },
  { key: "politics", Component: PoliticsPicker },
  { key: "religion", Component: ReligionPicker },
  { key: "work", Component: WorkInput },
  { key: "jobTitle", Component: JobTitleInput },
  { key: "educationLevel", Component: EduLevelInput },
  { key: "college", Component: CollegeInput },
  { key: "homeTown", Component: HomeTownInput },
  { key: "languages", Component: LanguagesPicker },
  { key: "ethnicity", Component: EthnicityPicker },
  { key: "children", Component: ChildrenPicker },
  { key: "pets", Component: PetsPicker },
  { key: "zodiacSign", Component: ZodiacPicker },
  { key: "drinkingHabits", Component: DrinkingPicker },
  { key: "smokingHabits", Component: SmokingPicker },
  { key: "marijuanaHabits", Component: MarijuanaPicker },
  { key: "drugUseHabits", Component: DrugsPicker },
];

const STORAGE_KEY_PREFIX = "onboarding_optional_progress";

export default function OnboardingOptionalWrapper() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [value, setValue] = useState<any>(undefined);

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

    if (save && value !== undefined) {
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

    setValue(undefined);
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

  const step = OPTIONAL_ONBOARDING_STEPS[currentIndex];
  const StepComponent = step?.Component;

  // 🔥 NORMALIZE VALUE BASED ON STEP TYPE
  const normalizedValue =
    step?.key === "languages"
      ? Array.isArray(value)
        ? value
        : []
      : value ?? "";

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />
      <View style={styles.content}>
        {StepComponent && (
          <StepComponent value={normalizedValue} onChange={setValue} />
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
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  bgOrbOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFF0F2",
    top: -42,
    left: -48,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFE4E8",
    bottom: 120,
    right: -40,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 16 : 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "rgba(250,248,243,0.96)",
  },
  skip: { fontSize: 16, color: "#6B7280", fontFamily: "Poppins-SemiBold" },
  nextButton: {
    backgroundColor: "#ff5864",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  nextText: { color: "#fff", fontFamily: "Poppins-Bold" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
