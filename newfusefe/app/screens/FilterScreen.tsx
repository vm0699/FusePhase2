import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Interests: { fromFilter?: boolean };
  FilterScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FilterScreen'>;

type DiscoveryFilters = {
  ageRange: { min: number; max: number };
  ageFlex: boolean;
  distanceKm: number;
  distanceFlex: boolean;
  interests: string[];
};

const BASE_URL = 'http://172.20.10.4:5000';

const FilterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  const [ageRange, setAgeRange] = useState<[number, number]>([18, 23]);
  const [distance, setDistance] = useState(17);
  const [ageExpand, setAgeExpand] = useState(false);
  const [distanceExpand, setDistanceExpand] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  /* ---------------- Load filters or fallback interests ---------------- */

  useEffect(() => {
    if (!isFocused) return;

    (async () => {
      const uid = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('jwtToken');
      setUserId(uid);

      if (!uid || !token) return;

      // 1️⃣ Load saved filters (if exist)
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
        } catch {
          // fall through
        }
      }

      // 2️⃣ Fallback → temporaryInterests (during transition)
      const temp = await AsyncStorage.getItem('temporaryInterests');
      if (temp) {
        try {
          const parsed = JSON.parse(temp);
          if (Array.isArray(parsed)) {
            setUserInterests(parsed);
            return;
          }
        } catch {}
      }

      // 3️⃣ Final fallback → profile interests
      const res = await fetch(`${BASE_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();
      if (json?.data?.interests) {
        setUserInterests(json.data.interests);
      }
    })();
  }, [isFocused]);

  /* ---------------- Actions ---------------- */

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

  /* ---------------- UI ---------------- */

  return (
    <View style={{ flex: 1 }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.topBarText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Filters</Text>

        <TouchableOpacity onPress={applyFilters}>
          <Text style={styles.topBarText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Age */}
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
          />
          <Slider
            minimumValue={ageRange[0]}
            maximumValue={60}
            step={1}
            value={ageRange[1]}
            onValueChange={(v) => setAgeRange([ageRange[0], v])}
            style={styles.slider}
          />

          <View style={styles.toggleRow}>
            <Text style={styles.helperText}>Expand age range if I run out</Text>
            <Switch value={ageExpand} onValueChange={setAgeExpand} />
          </View>
        </View>

        {/* Distance */}
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
          />

          <View style={styles.toggleRow}>
            <Text style={styles.helperText}>Expand distance if I run out</Text>
            <Switch value={distanceExpand} onValueChange={setDistanceExpand} />
          </View>
        </View>

        {/* Interests */}
        <Text style={styles.label}>Shared interests</Text>
        <Text style={styles.helperText}>
          We’ll try to show people who share at least one interest.
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Interests', { fromFilter: true })}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsContainer}>
              {userInterests.length === 0 ? (
                <Text style={{ color: '#888' }}>Tap to choose interests ➕</Text>
              ) : (
                userInterests.map((item, index) => (
                  <View key={index} style={styles.chip}>
                    <Text>{item}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Clear */}
        <TouchableOpacity onPress={clearFilters} style={{ marginTop: 24 }}>
          <Text style={{ color: 'red', textAlign: 'center', fontWeight: '600' }}>
            Clear all filters
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 16 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  topBarText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  topBarTitle: { fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  valueText: { fontSize: 16 },
  helperText: { fontSize: 14, color: '#666' },
  row: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  box: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
});

export default FilterScreen;
