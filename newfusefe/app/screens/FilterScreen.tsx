import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Interests: { fromFilter?: boolean };
  FilterScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "FilterScreen">;

type DiscoveryFilters = {
  ageRange: { min: number; max: number };
  ageFlex: boolean;
  distanceKm: number;
  distanceFlex: boolean;
  interests: string[];
};

const BASE_URL = "http://172.20.10.4:5000";

const FilterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  const [ageRange, setAgeRange] = useState<[number, number]>([18, 23]);
  const [distance, setDistance] = useState(17);
  const [ageExpand, setAgeExpand] = useState(false);
  const [distanceExpand, setDistanceExpand] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) return;

    (async () => {
      const uid = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("jwtToken");
      setUserId(uid);

      if (!uid || !token) return;

      const stored = await AsyncStorage.getItem(`filters:${uid}`);
      if (stored) {
        try {
          const parsed: DiscoveryFilters = JSON.parse(stored);
          setAgeRange([parsed.ageRange.min, parsed.ageRange.max]);
          setAgeExpand(parsed.ageFlex);
          setDistance(parsed.distanceKm);
          setDistanceExpand(parsed.distanceFlex);
          setUserInterests(parsed.interests || []);
          return;
        } catch {}
      }

      const temp = await AsyncStorage.getItem("temporaryInterests");
      if (temp) {
        try {
          const parsed = JSON.parse(temp);
          if (Array.isArray(parsed)) {
            setUserInterests(parsed);
            return;
          }
        } catch {}
      }

      const res = await fetch(`${BASE_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (json?.data?.interests) {
        setUserInterests(json.data.interests);
      }
    })();
  }, [isFocused]);

  const applyFilters = async () => {
    if (!userId) return;

    const filters: DiscoveryFilters = {
      ageRange: { min: ageRange[0], max: ageRange[1] },
      ageFlex: ageExpand,
      distanceKm: distance,
      distanceFlex: distanceExpand,
      interests: userInterests,
    };

    await AsyncStorage.setItem(`filters:${userId}`, JSON.stringify(filters));
    navigation.goBack();
  };

  const clearFilters = async () => {
    if (!userId) return;
    await AsyncStorage.removeItem(`filters:${userId}`);
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerPill} onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Filters</Text>
          <Text style={styles.headerSubtitle}>Tune your discovery preferences</Text>
        </View>

        <TouchableOpacity style={styles.headerPill} onPress={applyFilters}>
          <Text style={styles.headerDone}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>How old are they?</Text>
        <View style={styles.box}>
          <Text style={styles.valueText}>
            Between {ageRange[0]} and {ageRange[1]}
          </Text>

          <Slider
            minimumValue={18}
            maximumValue={60}
            step={1}
            value={ageRange[0]}
            onValueChange={(v) => setAgeRange([v, ageRange[1]])}
            style={styles.slider}
            minimumTrackTintColor="#ff5864"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#ff5864"
          />
          <Slider
            minimumValue={ageRange[0]}
            maximumValue={60}
            step={1}
            value={ageRange[1]}
            onValueChange={(v) => setAgeRange([ageRange[0], v])}
            style={styles.slider}
            minimumTrackTintColor="#ff5864"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#ff5864"
          />

          <View style={styles.toggleRow}>
            <Text style={styles.helperText}>Expand age range if I run out</Text>
            <Switch
              value={ageExpand}
              onValueChange={setAgeExpand}
              trackColor={{ false: "#E5E7EB", true: "#ff9aa3" }}
              thumbColor={ageExpand ? "#ff5864" : "#ffffff"}
            />
          </View>
        </View>

        <Text style={styles.label}>How far away are they?</Text>
        <View style={styles.box}>
          <Text style={styles.valueText}>Up to {distance} km away</Text>

          <Slider
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distance}
            onValueChange={setDistance}
            style={styles.slider}
            minimumTrackTintColor="#ff5864"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#ff5864"
          />

          <View style={styles.toggleRow}>
            <Text style={styles.helperText}>Expand distance if I run out</Text>
            <Switch
              value={distanceExpand}
              onValueChange={setDistanceExpand}
              trackColor={{ false: "#E5E7EB", true: "#ff9aa3" }}
              thumbColor={distanceExpand ? "#ff5864" : "#ffffff"}
            />
          </View>
        </View>

        <Text style={styles.label}>Shared interests</Text>
        <Text style={styles.helperTextStandalone}>
          We will try to show people who share at least one interest.
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("Interests", { fromFilter: true })}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsContainer}>
              {userInterests.length === 0 ? (
                <Text style={styles.emptyInterestsText}>Tap to choose interests</Text>
              ) : (
                userInterests.map((item, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
          <View style={styles.chevronBubble}>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear all filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
  },
  headerPill: {
    minWidth: 72,
    height: 38,
    borderRadius: 19,
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  headerButton: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  headerDone: {
    fontSize: 14,
    color: "#ff5864",
    fontFamily: "Poppins-Bold",
  },
  headerTitle: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginTop: 6,
    marginBottom: 10,
  },
  valueText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins",
    flex: 1,
    paddingRight: 10,
  },
  helperTextStandalone: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins",
    marginBottom: 10,
  },
  row: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  box: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingRight: 8,
  },
  chip: {
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 13,
    color: "#1a1a1a",
    fontFamily: "Poppins",
  },
  emptyInterestsText: {
    color: "#9CA3AF",
    fontFamily: "Poppins",
    fontSize: 13,
  },
  chevronBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    marginLeft: 10,
  },
  clearButton: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  clearText: {
    color: "#DC2626",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
  },
});

export default FilterScreen;
