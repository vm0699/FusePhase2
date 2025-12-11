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
import {
  useNavigation,
  useIsFocused,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Interests: { fromFilter?: boolean };
  FilterScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'FilterScreen'>;

const BASE_URL = 'http://172.20.10.4:5000';

const FilterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  const [ageRange, setAgeRange] = useState([18, 23]);
  const [distance, setDistance] = useState(17);
  const [ageExpand, setAgeExpand] = useState(false);
  const [distanceExpand, setDistanceExpand] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok && result.data?.interests) {
        setUserInterests(result.data.interests);
      } else {
        console.warn('⚠️ Could not fetch user interests');
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  const loadTemporaryInterests = async () => {
    try {
      const temp = await AsyncStorage.getItem('temporaryInterests');
      if (temp) {
        const parsed = JSON.parse(temp);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserInterests(parsed);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('Failed to parse temporaryInterests');
      return false;
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadTemporaryInterests().then((usedTemp) => {
        if (!usedTemp) fetchUserProfile();
      });
    }
  }, [isFocused]);

  return (
    <View style={{ flex: 1 }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.topBarText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>FilterScreen</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.topBarText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Age range */}
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
            onValueChange={(val) => setAgeRange([val, ageRange[1]])}
            style={styles.slider}
          />
          <Slider
            minimumValue={ageRange[0]}
            maximumValue={60}
            step={1}
            value={ageRange[1]}
            onValueChange={(val) => setAgeRange([ageRange[0], val])}
            style={styles.slider}
          />
          <View style={styles.toggleRow}>
            <Text style={styles.helperText}>See people 2 years either side if I run out</Text>
            <Switch value={ageExpand} onValueChange={setAgeExpand} />
          </View>
        </View>

        {/* Distance */}
        <Text style={styles.label}>How far away are they?</Text>
        <View style={styles.box}>
          <Text style={styles.valueText}>Up to {distance} kilometres away</Text>
          <Slider
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distance}
            onValueChange={setDistance}
            style={styles.slider}
          />
          <View style={styles.toggleRow}>
            <Text style={styles.helperText}>See people slightly further away if I run out</Text>
            <Switch value={distanceExpand} onValueChange={setDistanceExpand} />
          </View>
        </View>

        {/* Interests */}
        <Text style={styles.label}>Do they share any of your interests?</Text>
        <Text style={styles.helperText}>
          We’ll try to show you people who share any one of the interests you select.
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Interests', { fromFilter: true })}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsContainer}>
              {userInterests.length === 0 ? (
                <Text style={{ color: '#888' }}>Tap to choose your interests ➕</Text>
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

        <View style={styles.toggleRow}>
          <Text style={styles.helperText}>Show other people if I run out</Text>
          <Switch value={false} />
        </View>

        {/* Languages */}
        <Text style={styles.label}>Which languages do they know?</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert('Coming soon!', 'Language filter will be available soon.')}
        >
          <Text style={styles.valueText}>Select languages</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
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
