import React, { useState, useEffect, useContext } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingStepper from '../../components/OnboardingStepper';

const BASE_URL = 'http://172.20.10.4:5000';
const ONBOARDING_STEP_KEY = '@onboarding_step'; // 🔹 2.1 local resume key

const IntroPage = () => {
  const { updateNestedProfileData } = useContext(ProfileContext);
  const [firstName, setFirstName] = useState('');
  const [birthday, setBirthday] = useState({ day: '', month: '', year: '' });
  const [isDOBValid, setIsDOBValid] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(true);

  const navigation = useNavigation();

  // 🔹 2.1 — Persist local onboarding step (device-level)
  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'Intro');
  }, []);

  const validateDate = () => {
    const { day, month, year } = birthday;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    const currentYear = new Date().getFullYear();
    if (!d || !m || !y) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y > currentYear - 18 || y < currentYear - 100) return false;

    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  };

  useEffect(() => {
    setIsDOBValid(validateDate());
  }, [birthday]);

  const handleInputChange = (field, value) => {
    if (/^\d*$/.test(value)) {
      setBirthday({ ...birthday, [field]: value });
    }
  };

  const isComplete = firstName.trim() !== '' && isDOBValid;

  const handleNext = async () => {
    if (!isComplete) return;

    const dob = `${birthday.day.padStart(2, '0')}-${birthday.month.padStart(
      2,
      '0'
    )}-${birthday.year}`;

    // 🔹 Existing context updates (unchanged)
    updateNestedProfileData('intro', 'name', firstName.trim());
    updateNestedProfileData('intro', 'dob', dob);

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    // =====================================================
    // 🔥 2.1 CORE CHANGE — BACKEND CHECKPOINT UPDATE
    // This makes onboarding resume device-independent
    // =====================================================
    await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        updates: {
          name: firstName.trim(),
          dateOfBirth: dob,
          onboardingStage: 'INTRO_DONE', // ✅ BACKEND SOURCE OF TRUTH
        },
      }),
    });
    // =====================================================

    // 🔹 2.1 — Advance local resume pointer
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'ProfileSetup');

    navigation.navigate('ProfileSetup');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <OnboardingStepper currentStep={3} totalSteps={26} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.header}>Let's get to{'\n'}know you</Text>
            <Text style={styles.subtitle}>Let's start with the basics</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Text style={styles.label}>Your birthday</Text>

            <View style={styles.dateContainer}>
              <TextInput
                style={[
                  styles.dateInput,
                  !isDOBValid && birthday.day && styles.invalidInput,
                ]}
                value={birthday.day}
                onChangeText={(v) => handleInputChange('day', v)}
                placeholder="DD"
                placeholderTextColor="#9ca3af"
                maxLength={2}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.dateInput,
                  !isDOBValid && birthday.month && styles.invalidInput,
                ]}
                value={birthday.month}
                onChangeText={(v) => handleInputChange('month', v)}
                placeholder="MM"
                placeholderTextColor="#9ca3af"
                maxLength={2}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.dateInput,
                  !isDOBValid && birthday.year && styles.invalidInput,
                ]}
                value={birthday.year}
                onChangeText={(v) => handleInputChange('year', v)}
                placeholder="YYYY"
                placeholderTextColor="#9ca3af"
                maxLength={4}
                keyboardType="numeric"
              />
            </View>

            {!isDOBValid && (birthday.day || birthday.month || birthday.year) && (
              <Text style={styles.errorText}>
                You must be 18 or older to continue
              </Text>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.button,
            isComplete ? styles.activeButton : styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!isComplete}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>

        {/* 🔔 Existing warning modal — unchanged */}
        <Modal visible={showWarningModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>⚠️ Don't Exit Yet</Text>
              <Text style={styles.modalMessage}>
                Your profile will only be saved after you complete all steps and
                accept the guidelines.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowWarningModal(false)}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingTop: 60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },
  content: {
    flex: 1,
  },
  header: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
    lineHeight: 56,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    fontFamily: 'Poppins',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    height: 56,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  dateInput: {
    flex: 1,
    height: 56,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
  },
  invalidInput: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
    fontSize: 14,
    bottom: 10,
    fontFamily: 'Poppins',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
  },
  activeButton: {
    backgroundColor: '#ff5864',
  },
  disabledButton: {
    backgroundColor: '#ff5864',
    opacity: 0.4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e11d48',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  modalMessage: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  modalButton: {
    backgroundColor: '#e11d48',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default IntroPage;
