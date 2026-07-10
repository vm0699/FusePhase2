import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { API_BASE_URL } from "../config/env";

type RootStackParamList = {
  Interests: { fromFilter?: boolean; currentValue?: string[] };
  FilterScreen: undefined;
};
type NavigationProp = StackNavigationProp<RootStackParamList, "FilterScreen">;

export type EventScope = "EVERYONE" | "EVENT_GOERS" | "MY_CIRCLES";

export type DiscoveryFilters = {
  ageRange: { min: number; max: number };
  ageFlex: boolean;
  distanceKm: number;
  distanceFlex: boolean;
  interests: string[];
  datingIntentions: string[];
  religion: string[];
  ethnicity: string[];
  drinking: string[];
  smoking: string[];
  activeOnly: boolean;
  eventScope: EventScope;
};

const TEMP_INTERESTS_KEY = "temporaryInterests";
const FILTERS_APPLIED_NOTICE_KEY = "filtersAppliedNoticePending";

const DEFAULT_FILTERS: DiscoveryFilters = {
  ageRange: { min: 18, max: 45 },
  ageFlex: true,
  distanceKm: 50,
  distanceFlex: true,
  interests: [],
  datingIntentions: [],
  religion: [],
  ethnicity: [],
  drinking: [],
  smoking: [],
  activeOnly: false,
  eventScope: "EVERYONE",
};

// Option lists matching the existing picker components
const DATING_INTENTION_OPTIONS = [
  "Long-term relationship",
  "Short-term relationship",
  "New friends",
  "Open to exploring",
  "Marriage",
  "Not sure yet",
];

const RELIGION_OPTIONS = [
  "Hindu",
  "Christian",
  "Muslim",
  "Jain",
  "Sikh",
  "Buddhist",
  "Atheist",
  "Spiritual",
  "Other",
];

const ETHNICITY_OPTIONS = [
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
];

const DRINKING_OPTIONS = ["Yes", "No", "Sometimes", "Prefer not to say"];
const SMOKING_OPTIONS = ["Yes", "No", "Sometimes", "Prefer not to say"];

// ── Pill chip used for multi-select sections ──────────────────────────────────
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ── Toggle row inside a card ──────────────────────────────────────────────────
function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E7EB", true: "#ff9aa3" }}
        thumbColor={value ? "#ff5864" : "#ffffff"}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <View style={styles.divider} />;
}

// ─────────────────────────────────────────────────────────────────────────────

const FilterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  const toggle = useCallback(<K extends keyof DiscoveryFilters>(
    field: K,
    value: DiscoveryFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleMulti = useCallback(
    (field: "datingIntentions" | "religion" | "ethnicity" | "drinking" | "smoking", item: string) => {
      setFilters((prev) => {
        const current = prev[field] as string[];
        return {
          ...prev,
          [field]: current.includes(item)
            ? current.filter((v) => v !== item)
            : [...current, item],
        };
      });
    },
    []
  );

  // ── load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFocused) return;

    (async () => {
      setLoading(true);
      const uid = await AsyncStorage.getItem("userId");
      const tok = await AsyncStorage.getItem("jwtToken");
      setUserId(uid);
      setToken(tok);

      if (!uid || !tok) {
        setLoading(false);
        return;
      }

      // 1. Check for in-progress interest selection from Interests screen
      let tempInterests: string[] | null = null;
      try {
        const temp = await AsyncStorage.getItem(TEMP_INTERESTS_KEY);
        if (temp) {
          const parsed = JSON.parse(temp);
          if (Array.isArray(parsed)) tempInterests = parsed;
        }
      } catch {}

      // 2. Try to load from server first (source of truth for cross-device sync)
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/discovery-preferences`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.ok) {
          const json = await res.json();
          const prefs = json.preferences;
          if (prefs && typeof prefs === "object") {
            const merged: DiscoveryFilters = {
              ageRange: prefs.ageRange ?? DEFAULT_FILTERS.ageRange,
              ageFlex: prefs.ageFlex ?? DEFAULT_FILTERS.ageFlex,
              distanceKm: prefs.distanceKm ?? DEFAULT_FILTERS.distanceKm,
              distanceFlex: prefs.distanceFlex ?? DEFAULT_FILTERS.distanceFlex,
              interests: tempInterests ?? (prefs.interests ?? []),
              datingIntentions: prefs.datingIntentions ?? [],
              religion: prefs.religion ?? [],
              ethnicity: prefs.ethnicity ?? [],
              drinking: prefs.drinking ?? [],
              smoking: prefs.smoking ?? [],
              activeOnly: prefs.activeOnly ?? false,
              eventScope: prefs.eventScope ?? DEFAULT_FILTERS.eventScope,
            };
            setFilters(merged);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 3. Fall back to AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(`filters:${uid}`);
        if (stored) {
          const parsed: DiscoveryFilters = JSON.parse(stored);
          setFilters({
            ...DEFAULT_FILTERS,
            ...parsed,
            interests: tempInterests ?? parsed.interests ?? [],
          });
          setLoading(false);
          return;
        }
      } catch {}

      // 4. Nothing stored — apply tempInterests if any
      if (tempInterests) {
        setFilters((prev) => ({ ...prev, interests: tempInterests! }));
      }
      setLoading(false);
    })();
  }, [isFocused]);

  // Also pick up interest changes when returning from the Interests screen
  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      try {
        const temp = await AsyncStorage.getItem(TEMP_INTERESTS_KEY);
        if (temp) {
          const parsed = JSON.parse(temp);
          if (Array.isArray(parsed)) {
            setFilters((prev) => ({ ...prev, interests: parsed }));
          }
        }
      } catch {}
    })();
  }, [isFocused]);

  // ── apply ──────────────────────────────────────────────────────────────────
  const applyFilters = async () => {
    if (!userId || saving) return;
    setSaving(true);

    // 1. Always write to AsyncStorage immediately (fast)
    await AsyncStorage.setItem(`filters:${userId}`, JSON.stringify(filters));
    await AsyncStorage.setItem(FILTERS_APPLIED_NOTICE_KEY, "1");
    await AsyncStorage.removeItem(TEMP_INTERESTS_KEY);

    // 2. Persist to server in the background (fire and forget — don't block UX)
    if (token) {
      fetch(`${API_BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates: { discoveryPreferences: filters } }),
      }).catch(() => {});
    }

    setSaving(false);
    navigation.goBack();
  };

  // ── clear ──────────────────────────────────────────────────────────────────
  const clearFilters = async () => {
    if (!userId) return;
    setFilters(DEFAULT_FILTERS);
    await AsyncStorage.removeItem(`filters:${userId}`);
    await AsyncStorage.removeItem(TEMP_INTERESTS_KEY);

    if (token) {
      fetch(`${API_BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates: { discoveryPreferences: DEFAULT_FILTERS } }),
      }).catch(() => {});
    }

    await AsyncStorage.setItem(FILTERS_APPLIED_NOTICE_KEY, "1");
    navigation.goBack();
  };

  const handleCancel = async () => {
    await AsyncStorage.removeItem(TEMP_INTERESTS_KEY);
    navigation.goBack();
  };

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff5864" />
      </View>
    );
  }

  const activeFiltersCount = [
    filters.datingIntentions.length > 0,
    filters.religion.length > 0,
    filters.ethnicity.length > 0,
    filters.drinking.length > 0,
    filters.smoking.length > 0,
    filters.activeOnly,
    filters.interests.length > 0,
    filters.eventScope !== "EVERYONE",
  ].filter(Boolean).length;

  return (
    <View style={styles.screen}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerPill} onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Filters</Text>
          {activeFiltersCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {activeFiltersCount} active
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.headerPill, styles.applyPill]}
          onPress={applyFilters}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ff5864" />
          ) : (
            <Text style={styles.headerApplyText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── BASICS ── */}
        <Section label="BASICS">
          {/* Age range */}
          <View style={styles.sliderBlock}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderField}>Age</Text>
              <Text style={styles.sliderValue}>
                {filters.ageRange.min} – {filters.ageRange.max}
              </Text>
            </View>
            <Slider
              minimumValue={18}
              maximumValue={60}
              step={1}
              value={filters.ageRange.min}
              onValueChange={(v) =>
                toggle("ageRange", {
                  min: Math.min(v, filters.ageRange.max - 1),
                  max: filters.ageRange.max,
                })
              }
              style={styles.slider}
              minimumTrackTintColor="#ff5864"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#ff5864"
            />
            <Slider
              minimumValue={18}
              maximumValue={60}
              step={1}
              value={filters.ageRange.max}
              onValueChange={(v) =>
                toggle("ageRange", {
                  min: filters.ageRange.min,
                  max: Math.max(v, filters.ageRange.min + 1),
                })
              }
              style={styles.slider}
              minimumTrackTintColor="#ff5864"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#ff5864"
            />
            <ToggleRow
              label="Expand age range if I run out"
              value={filters.ageFlex}
              onValueChange={(v) => toggle("ageFlex", v)}
            />
          </View>

          <Divider />

          {/* Distance */}
          <View style={styles.sliderBlock}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderField}>Distance</Text>
              <Text style={styles.sliderValue}>
                {filters.distanceKm < 100
                  ? `${filters.distanceKm} km`
                  : "100+ km"}
              </Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={filters.distanceKm}
              onValueChange={(v) => toggle("distanceKm", v)}
              style={styles.slider}
              minimumTrackTintColor="#ff5864"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#ff5864"
            />
            <ToggleRow
              label="Expand distance if I run out"
              value={filters.distanceFlex}
              onValueChange={(v) => toggle("distanceFlex", v)}
            />
          </View>
        </Section>

        {/* ── ACTIVITY ── */}
        <Section label="ACTIVITY">
          <ToggleRow
            label="Recently active only"
            value={filters.activeOnly}
            onValueChange={(v) => toggle("activeOnly", v)}
          />
          {filters.activeOnly && (
            <Text style={styles.helperNote}>
              Only show people who were active in the last 7 days.
            </Text>
          )}
        </Section>

        {/* ── EVENT DISCOVERY ── */}
        <Section label="PEOPLE WHO GO OUT">
          <View style={styles.eventScopeRow}>
            {(
              [
                { key: "EVERYONE", label: "Everyone" },
                { key: "EVENT_GOERS", label: "Event-goers" },
                { key: "MY_CIRCLES", label: "My circles" },
              ] as { key: EventScope; label: string }[]
            ).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.eventScopePill,
                  filters.eventScope === opt.key && styles.eventScopePillActive,
                ]}
                onPress={() => toggle("eventScope", opt.key)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.eventScopePillText,
                    filters.eventScope === opt.key && styles.eventScopePillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperNote}>
            {filters.eventScope === "EVENT_GOERS"
              ? "Only show people who've checked into at least one Fuse event."
              : filters.eventScope === "MY_CIRCLES"
              ? "Only show people who share an event circle with you."
              : "Show everyone, regardless of event activity."}
          </Text>
        </Section>

        {/* ── INTERESTS ── */}
        <Section label="INTERESTS">
          <TouchableOpacity
            style={styles.interestsRow}
            onPress={() =>
              navigation.navigate("Interests", {
                fromFilter: true,
                currentValue: filters.interests,
              })
            }
            activeOpacity={0.8}
          >
            <View style={styles.interestsContent}>
              {filters.interests.length === 0 ? (
                <Text style={styles.placeholderText}>Tap to choose interests</Text>
              ) : (
                <View style={styles.chipsWrap}>
                  {filters.interests.map((item) => (
                    <View key={item} style={styles.chip}>
                      <Text style={styles.chipText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.chevron}>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.helperNote}>
            Profiles matching these interests rank higher.
          </Text>
        </Section>

        {/* ── LOOKING FOR ── */}
        <Section label="LOOKING FOR">
          <Text style={styles.subLabel}>Dating Intentions</Text>
          <View style={styles.chipsWrap}>
            {DATING_INTENTION_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={filters.datingIntentions.includes(opt)}
                onPress={() => toggleMulti("datingIntentions", opt)}
              />
            ))}
          </View>
        </Section>

        {/* ── LIFESTYLE ── */}
        <Section label="LIFESTYLE">
          <Text style={styles.subLabel}>Drinking</Text>
          <View style={styles.chipsWrap}>
            {DRINKING_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={filters.drinking.includes(opt)}
                onPress={() => toggleMulti("drinking", opt)}
              />
            ))}
          </View>

          <Divider />

          <Text style={styles.subLabel}>Smoking</Text>
          <View style={styles.chipsWrap}>
            {SMOKING_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={filters.smoking.includes(opt)}
                onPress={() => toggleMulti("smoking", opt)}
              />
            ))}
          </View>
        </Section>

        {/* ── BACKGROUND ── */}
        <Section label="BACKGROUND">
          <Text style={styles.subLabel}>Religion</Text>
          <View style={styles.chipsWrap}>
            {RELIGION_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={filters.religion.includes(opt)}
                onPress={() => toggleMulti("religion", opt)}
              />
            ))}
          </View>

          <Divider />

          <Text style={styles.subLabel}>Ethnicity</Text>
          <View style={styles.chipsWrap}>
            {ETHNICITY_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={filters.ethnicity.includes(opt)}
                onPress={() => toggleMulti("ethnicity", opt)}
              />
            ))}
          </View>
        </Section>

        {/* ── CLEAR ── */}
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear all filters</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default FilterScreen;

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FAF8F3",
    justifyContent: "center",
    alignItems: "center",
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 14,
    backgroundColor: "#FAF8F3",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Poppins",
    color: "#ff5864",
    marginTop: 1,
  },
  headerPill: {
    minWidth: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  applyPill: {
    backgroundColor: "#fff5f6",
  },
  headerButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  headerApplyText: {
    fontSize: 14,
    color: "#ff5864",
    fontFamily: "Poppins-Bold",
  },

  // SCROLL
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // SECTION
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  // SLIDERS
  sliderBlock: {
    paddingVertical: 4,
  },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  sliderField: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  sliderValue: {
    fontSize: 14,
    color: "#ff5864",
    fontFamily: "Poppins-SemiBold",
  },
  slider: {
    width: "100%",
    height: 36,
  },

  // TOGGLE ROW
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins",
    flex: 1,
    paddingRight: 12,
  },

  // DIVIDER
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 14,
  },

  // SUB-LABEL (inside cards)
  subLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 10,
  },

  // CHIPS
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    rowGap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: "#fff5f6",
    borderColor: "#ff5864",
  },
  chipText: {
    fontSize: 13,
    color: "#4B5563",
    fontFamily: "Poppins",
  },
  chipTextSelected: {
    color: "#ff5864",
    fontFamily: "Poppins-SemiBold",
  },

  // INTERESTS ROW
  interestsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  interestsContent: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  eventScopeRow: {
    flexDirection: "row",
    gap: 8,
  },
  eventScopePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  eventScopePillActive: {
    backgroundColor: "#FFE7E9",
    borderColor: "#ff5864",
  },
  eventScopePillText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#6B7280",
  },
  eventScopePillTextActive: {
    color: "#ff5864",
  },

  // HELPER NOTE
  helperNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    marginTop: 8,
    lineHeight: 17,
  },

  // CLEAR
  clearButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  clearText: {
    color: "#DC2626",
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
  },
});
