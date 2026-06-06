import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FuseFieldShell from "../../components/FuseFieldShell";
import { setProfileEditDraft } from "../utils/profileEditDraft";

const TEMP_DISCOVERY_INTERESTS_KEY = "temporaryInterests";

const normalizeInterest = (value: unknown) =>
  typeof value === "string"
    ? value.replace(/^[^\p{L}\p{N}]+/u, "").trim()
    : "";

const normalizeInterestList = (values: unknown) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(normalizeInterest)
        .filter((value) => value.length > 0)
    )
  );
};

type InterestsScreenParams = {
  fromFilter?: boolean;
  currentValue?: string[];
  mode?: "edit" | "onboarding";
  fieldKey?: string;
};

const interestsData = {
  "Self-care": ["Aromatherapy", "Astrology", "Cold plunging", "Crystals", "Deep chats", "Journalling", "Mindfulness", "Nutrition"],
  Sports: ["Gym", "American football", "Athletics", "Badminton", "Baseball", "Basketball", "Bodybuilding", "Bouldering"],
  Creativity: ["Art", "Crafts", "Crocheting", "Dancing", "Design", "Drawing", "Fashion", "Knitting"],
  "Going out": ["Bars", "Cafe-hopping", "Drag shows", "Festivals", "Films", "Gigs", "Improv", "Karaoke"],
  "Staying in": ["AI", "Baking", "Board games", "Chess", "Cooking", "Gardening", "House plants", "Podcasts"],
  "Film and TV": ["Action & adventure", "Animated", "Anime", "Bollywood", "Comedy", "Cooking shows", "Crime", "Documentaries"],
  Reading: ["Action & adventure", "Biographies", "Classics", "Comedy", "Comic books", "Crime", "Fantasy", "History"],
  Music: ["Afro", "Arab", "Blues", "Classical", "Country", "Desi", "EDM", "Electronic"],
  "Food and drink": ["Beer", "BBQ", "Biryani", "Boba tea", "Burgers", "Cake", "Cocktails", "Coffee"],
  Travelling: ["City breaks", "Backpacking", "Beaches", "Camping", "Country escapes", "Fishing trips", "Hiking trips", "Road trips"],
};

export default function InterestsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, InterestsScreenParams>, string>>();

  const fromFilter = route.params?.fromFilter || false;
  const mode = route.params?.mode === "onboarding" ? "onboarding" : "edit";
  const fieldKey = route.params?.fieldKey ?? "interests";

  const serializedCurrentValue = JSON.stringify(route.params?.currentValue ?? []);
  const [selected, setSelected] = useState<string[]>(
    normalizeInterestList(route.params?.currentValue)
  );
  const selectedRef = useRef<string[]>(
    normalizeInterestList(route.params?.currentValue)
  );
  const [showPopup, setShowPopup] = useState(fromFilter);

  const syncEditSelection = (nextValue: string[]) => {
    if (mode === "edit") {
      setProfileEditDraft(fieldKey, nextValue);
    }
  };

  useEffect(() => {
    if (Array.isArray(route.params?.currentValue)) {
      const nextSelected = normalizeInterestList(route.params?.currentValue);
      selectedRef.current = nextSelected;
      setSelected(nextSelected);
    }
  }, [serializedCurrentValue]);

  useEffect(() => {
    if (!fromFilter || Array.isArray(route.params?.currentValue)) return;

    (async () => {
      const stored = await AsyncStorage.getItem(TEMP_DISCOVERY_INTERESTS_KEY);
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const normalized = normalizeInterestList(parsed);
          selectedRef.current = normalized;
          setSelected(normalized);
        }
      } catch {}
    })();
  }, [fromFilter, route.params?.currentValue]);

  const toggleSelect = async (item: string) => {
    const currentSelection = selectedRef.current;
    const nextValue = currentSelection.includes(item)
      ? currentSelection.filter((entry) => entry !== item)
      : currentSelection.length < 5
        ? [...currentSelection, item]
        : currentSelection;

    if (nextValue === currentSelection) {
      return;
    }

    selectedRef.current = nextValue;
    setSelected(nextValue);

    if (fromFilter) {
      await AsyncStorage.setItem(
        TEMP_DISCOVERY_INTERESTS_KEY,
        JSON.stringify(nextValue)
      );
      return;
    }

    syncEditSelection(nextValue);
  };

  const handleDone = async () => {
    if (fromFilter) {
      await AsyncStorage.setItem(
        TEMP_DISCOVERY_INTERESTS_KEY,
        JSON.stringify(selectedRef.current)
      );
      navigation.goBack();
      return;
    }

    syncEditSelection(selectedRef.current);

    navigation.goBack();
  };

  return (
    <FuseFieldShell
      title="Interests"
      mode={mode}
      onBack={() => navigation.goBack()}
      onDone={handleDone}
    >
      <View style={styles.container}>
        <Modal visible={showPopup} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.popupBubble}>
              <Text style={styles.popupText}>
                Interests chosen here are temporary for discovery only. Update
                your profile to change them permanently.
              </Text>
              <TouchableOpacity
                style={styles.popupButton}
                onPress={() => setShowPopup(false)}
              >
                <Text style={styles.popupButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Profile Detail</Text>
            <Text style={styles.title}>Interests</Text>
            <Text style={styles.subtitle}>
              Choose up to five interests that feel the most like you.
            </Text>
          </View>

          {Object.entries(interestsData).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.category}>{category}</Text>
              <View style={styles.grid}>
                {items.map((item) => {
                  const isSelected = selected.includes(item);

                  return (
                    <TouchableOpacity
                      key={`${category}-${item}`}
                      onPress={() => toggleSelect(item)}
                      style={[styles.chip, isSelected && styles.selectedChip]}
                      activeOpacity={0.88}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </FuseFieldShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  eyebrow: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  category: {
    fontSize: 13,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedChip: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FBC9CF",
  },
  chipText: {
    fontSize: 14,
    color: "#1a1a1a",
    fontFamily: "Poppins",
  },
  selectedText: {
    color: "#ff5864",
    fontFamily: "Poppins-SemiBold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 24,
  },
  popupBubble: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 22,
    alignItems: "center",
  },
  popupText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 21,
    textAlign: "center",
    fontFamily: "Poppins",
    marginBottom: 16,
  },
  popupButton: {
    backgroundColor: "#ff5864",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
  },
  popupButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
});
