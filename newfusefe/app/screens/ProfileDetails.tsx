import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SelectableTag } from '../../components/SelectableTag';
import { CircularNextButton } from '../../components/CircularNextButton';
import { useProfile } from '../../ProfileContext';
import OnboardingStepper from '../../components/OnboardingStepper';

const BASE_URL = 'http://172.20.10.4:5000';
const ONBOARDING_STEP_KEY = '@onboarding_step'; // 🔹 2.1

const HEIGHTS = Array.from({ length: 101 }, (_, i) => 120 + i);

const INTERESTS = [
  { emoji: '🕯️', label: 'Aromatherapy' }, { emoji: '🌠', label: 'Astrology' },
  { emoji: '❄️', label: 'Cold plunging' }, { emoji: '💎', label: 'Crystals' },
  { emoji: '💬', label: 'Deep chats' }, { emoji: '✍', label: 'Journalling' },
  { emoji: '🧠', label: 'Mindfulness' }, { emoji: '🥦', label: 'Nutrition' },
  { emoji: '🤸‍♂️', label: 'Gym' }, { emoji: '🏈', label: 'American football' },
  { emoji: '🏊', label: 'Athletics' }, { emoji: '🏋️', label: 'Badminton' },
  { emoji: '⚾', label: 'Baseball' }, { emoji: '🏀', label: 'Basketball' },
  { emoji: '💪', label: 'Bodybuilding' }, { emoji: '🧓', label: 'Bouldering' },
  { emoji: '🎨', label: 'Art' }, { emoji: '🔊', label: 'Crafts' },
  { emoji: '🧾', label: 'Crocheting' }, { emoji: '💃', label: 'Dancing' },
  { emoji: '🖊️', label: 'Design' }, { emoji: '🖋️', label: 'Drawing' },
  { emoji: '👗', label: 'Fashion' }, { emoji: '🧵', label: 'Knitting' },
  { emoji: '🍻', label: 'Bars' }, { emoji: '☕️', label: 'Cafe-hopping' },
  { emoji: '🏆', label: 'Drag shows' }, { emoji: '🎉', label: 'Festivals' },
  { emoji: '🍿', label: 'Films' }, { emoji: '🎟', label: 'Gigs' },
  { emoji: '👩‍🎤', label: 'Improv' }, { emoji: '🎤', label: 'Karaoke' },
  { emoji: '🤖', label: 'AI' },
];

const VALUES = [
  'Ambition', 'Confidence', 'Empathy', 'Generosity', 'Humour',
  'Kindness', 'Openness', 'Optimism', 'Playfulness', 'Sassiness',
  'Leadership', 'Curiosity', 'Gratitude', 'Humility', 'Loyalty',
  'Sarcasm', 'Emotional intelligence',
];

export default function ProfileDetailsPage({ navigation }) {
  const { profileData, updateNestedProfileData } = useProfile();
  const { profileDetails } = profileData;

  // 🔹 2.1 — Persist onboarding step locally
  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'ProfileDetails');
  }, []);

  const [height, setHeight] = useState(profileDetails.height || 168);
  const [selectedInterests, setSelectedInterests] = useState(
    profileDetails.interests || []
  );
  const [selectedValues, setSelectedValues] = useState(
    profileDetails.values || []
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInterests = INTERESTS.filter((interest) =>
    interest.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleInterest = (label) => {
    const entry = INTERESTS.find((i) => i.label === label);
    if (!entry) return;

    const full = entry.label;

    setSelectedInterests((prev) => {
      if (prev.includes(full)) return prev.filter((i) => i !== full);
      if (prev.length >= 5) return prev;
      return [...prev, full];
    });
  };

  const toggleValue = (value) => {
    setSelectedValues((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  };

  const isComplete =
    height &&
    selectedInterests.length > 0 &&
    selectedValues.length > 0;

  const handleNext = async () => {
    updateNestedProfileData('profileDetails', 'height', height);
    updateNestedProfileData('profileDetails', 'interests', selectedInterests);
    updateNestedProfileData('profileDetails', 'values', selectedValues);

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    // =====================================================
    // 🔥 2.1 CORE CHANGE — BACKEND CHECKPOINT UPDATE
    // Saves height, interests, values + onboardingStage
    // =====================================================
    await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        updates: {
          height,
          interests: selectedInterests,
          values: selectedValues,
          onboardingStage: 'DETAILS_DONE', // ✅ backend checkpoint
        },
      }),
    });
    // =====================================================

    // 🔹 2.1 — Advance local resume pointer
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'PromptSelection');

    navigation.navigate('PromptSelection');
  };

  // Step state: 0=Height, 1=Interests, 2=Values
  const [step, setStep] = useState(0);

  const canAdvance =
    step === 0 ? !!height :
      step === 1 ? selectedInterests.length > 0 :
        selectedValues.length > 0;

  const handleStepNext = () => {
    if (step < 2) setStep(step + 1);
    else handleNext();
  };

  const STEPS = ['Height', 'Interests', 'Values'];

  return (
    <View style={styles.container}>
      {/* Onboarding progress */}
      <OnboardingStepper currentStep={6} totalSteps={26} />

      {/* Sub-step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => i < step && setStep(i)}
            style={styles.stepItem}
          >
            <View style={[
              styles.stepDot,
              i === step && styles.stepDotActive,
              i < step && styles.stepDotDone,
            ]}>
              {i < step ? (
                <Text style={styles.stepDotCheckmark}>✓</Text>
              ) : (
                <Text style={[styles.stepDotNum, i === step && styles.stepDotNumActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.stepLineContainer}>
          <View style={[styles.stepLine, step >= 1 && styles.stepLineFilled]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineFilled]} />
        </View>
      </View>

      {/* Height Step */}
      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How tall are you?</Text>
          <Text style={styles.cardSubtitle}>Scroll to your height</Text>
          <View style={styles.heightDisplayRow}>
            <Text style={styles.heightSelected}>{height} cm</Text>
          </View>
          <ScrollView
            style={styles.heightScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {HEIGHTS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHeight(h)}
                style={[
                  styles.heightOption,
                  height === h && styles.heightOptionSelected,
                ]}
              >
                <Text style={[
                  styles.heightText,
                  height === h && styles.heightTextSelected,
                ]}>
                  {h} cm
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Interests Step */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What are you into?</Text>
          <Text style={styles.cardSubtitle}>Pick up to 5 interests</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <ScrollView
            style={styles.tagScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.tagContainer}>
              {filteredInterests.map((interest) => {
                const full = `${interest.emoji} ${interest.label}`;
                return (
                  <SelectableTag
                    key={full}
                    selected={selectedInterests.includes(full)}
                    onPress={() => toggleInterest(interest.label)}
                    disabled={selectedInterests.length >= 5 && !selectedInterests.includes(full)}
                  >
                    {interest.emoji} {interest.label}
                  </SelectableTag>
                );
              })}
            </View>
          </ScrollView>
          <Text style={styles.counter}>{selectedInterests.length}/5 selected</Text>
        </View>
      )}

      {/* Values Step */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What do you value?</Text>
          <Text style={styles.cardSubtitle}>Pick up to 3 values in a person</Text>
          <ScrollView
            style={styles.tagScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.tagContainer}>
              {VALUES.map((value) => (
                <SelectableTag
                  key={value}
                  selected={selectedValues.includes(value)}
                  onPress={() => toggleValue(value)}
                  disabled={selectedValues.length >= 3 && !selectedValues.includes(value)}
                >
                  {value}
                </SelectableTag>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.counter}>{selectedValues.length}/3 selected</Text>
        </View>
      )}

      {/* CTA Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          canAdvance ? styles.activeButton : styles.disabledButton,
        ]}
        onPress={handleStepNext}
        disabled={!canAdvance}
      >
        <Text style={styles.nextButtonText}>
          {step < 2 ? 'Continue' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingTop: 60,
    paddingHorizontal: 24,
  },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
    position: 'relative',
  },
  stepLineContainer: {
    position: 'absolute',
    flexDirection: 'row',
    left: '18%',
    right: '18%',
    top: 14,
    zIndex: 0,
    gap: 0,
    justifyContent: 'space-between',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 2,
  },
  stepLineFilled: {
    backgroundColor: '#ff5864',
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 1,
    flex: 1,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: {
    borderColor: '#ff5864',
    backgroundColor: '#fff5f6',
  },
  stepDotDone: {
    borderColor: '#ff5864',
    backgroundColor: '#ff5864',
  },
  stepDotNum: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins-SemiBold',
  },
  stepDotNumActive: {
    color: '#ff5864',
  },
  stepDotCheckmark: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'Poppins-SemiBold',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins',
  },
  stepLabelActive: {
    color: '#ff5864',
    fontFamily: 'Poppins-SemiBold',
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Poppins',
    marginBottom: 20,
  },

  // Height
  heightDisplayRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  heightSelected: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ff5864',
    fontFamily: 'Poppins',
  },
  heightScroll: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  heightOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  heightOptionSelected: {
    backgroundColor: '#fff5f6',
    borderLeftWidth: 3,
    borderLeftColor: '#ff5864',
  },
  heightText: {
    color: '#6B7280',
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  heightTextSelected: {
    color: '#ff5864',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },

  // Tags
  searchInput: {
    height: 48,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#FAF8F3',
    fontFamily: 'Poppins',
    marginBottom: 14,
  },
  tagScroll: {
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  counter: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Poppins',
    textAlign: 'right',
  },

  // Button
  nextButton: {
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  activeButton: {
    backgroundColor: '#ff5864',
  },
  disabledButton: {
    backgroundColor: '#ff5864',
    opacity: 0.4,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});


