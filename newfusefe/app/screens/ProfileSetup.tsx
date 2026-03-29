import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingStepper from '../../components/OnboardingStepper';

const BASE_URL = 'http://172.20.10.4:5000';
const ONBOARDING_STEP_KEY = '@onboarding_step';

export default function ProfileSetupPage() {
  const navigation = useNavigation<any>();
  const { profileData, updateProfileData } = useContext(ProfileContext);

  const [localProfile, setLocalProfile] = useState({
    username: profileData.options.username || '',
    gender: profileData.options.gender || '',
    mode: profileData.options.reason || '',
  });

  // 🔹 Persist onboarding step
  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'ProfileSetup');
  }, []);

  const [isUsernameValid, setIsUsernameValid] = useState(
    localProfile.username.length >= 8 && localProfile.username.length <= 15
  );

  const validateUsername = (text: string) => {
    setLocalProfile({ ...localProfile, username: text });
    setIsUsernameValid(text.length >= 8 && text.length <= 15);
  };

  const isComplete =
    localProfile.gender !== '' &&
    localProfile.mode !== '' &&
    isUsernameValid;

  const handleNavigate = async () => {
    if (!isComplete) return;

    updateProfileData('options', {
      ...profileData.options,
      ...localProfile,
    });

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        updates: {
          username: localProfile.username,
          gender: localProfile.gender,
          onboardingStage: 'PROFILE_SETUP_DONE',
        },
      }),
    });

    // 🔹 Resume pointer → Location (MANDATORY)
    await AsyncStorage.setItem(
      ONBOARDING_STEP_KEY,
      'LocationSetup'
    );

    // 🔹 Navigate to Location screen
    navigation.navigate('LocationSetup');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <OnboardingStepper currentStep={4} totalSteps={26} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Complete your{'\n'}profile</Text>
                <Text style={styles.subtitle}>Just a few more details to get started</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    !isUsernameValid && localProfile.username.length > 0
                      ? styles.inputInvalid
                      : isUsernameValid
                        ? styles.inputValid
                        : {},
                  ]}
                  value={localProfile.username}
                  onChangeText={validateUsername}
                  placeholder="Enter your username"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                />
                {localProfile.username.length > 0 && !isUsernameValid && (
                  <Text style={styles.errorText}>
                    Username must be between 8–15 characters
                  </Text>
                )}
                {isUsernameValid && (
                  <Text style={styles.successText}>
                    Great username! ✓
                  </Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Which gender best describes you?
                </Text>
                {['Woman', 'Man', 'Nonbinary'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      localProfile.gender === option &&
                      styles.radioOptionSelected,
                    ]}
                    onPress={() =>
                      setLocalProfile({ ...localProfile, gender: option })
                    }
                  >
                    <View style={[
                      styles.radioCircle,
                      localProfile.gender === option && styles.radioCircleSelected
                    ]}>
                      {localProfile.gender === option && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={[
                      styles.radioLabel,
                      localProfile.gender === option && styles.radioLabelSelected
                    ]}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.note}>
                  You can always update this later.{' '}
                  <Text style={styles.link}>
                    A note about gender on Fuse.
                  </Text>
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  What brings you to Fuse?
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Romance and butterflies or a beautiful friendship?
                </Text>

                {[
                  {
                    value: 'Date',
                    label: 'Date',
                    description:
                      'Find a relationship, something casual, or anything in-between',
                  },
                  {
                    value: 'BFF',
                    label: 'BFF',
                    description:
                      'Make new friends and find your community',
                  },
                  {
                    value: 'Bizz',
                    label: 'Bizz',
                    description:
                      'Network professionally and make career moves',
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioOptionLarge,
                      localProfile.mode === option.value &&
                      styles.radioOptionLargeSelected,
                    ]}
                    onPress={() =>
                      setLocalProfile({
                        ...localProfile,
                        mode: option.value,
                      })
                    }
                  >
                    <View style={[
                      styles.radioCircle,
                      localProfile.mode === option.value && styles.radioCircleSelected
                    ]}>
                      {localProfile.mode === option.value && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.radioLabel,
                        localProfile.mode === option.value && styles.radioLabelSelected
                      ]}>{option.label}</Text>
                      <Text style={styles.radioDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <Text style={styles.note}>
                  You'll only be shown to people in the same mode as you.
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.nextButton,
              isComplete ? styles.activeButton : styles.disabledButton,
            ]}
            onPress={handleNavigate}
            disabled={!isComplete}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingTop: 60,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 44,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 10,
    fontFamily: 'Poppins',
    lineHeight: 52,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Poppins',
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#ff5864',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
  },
  inputInvalid: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputValid: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  successText: {
    color: '#10b981',
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  radioOptionSelected: {
    borderColor: '#ff5864',
    backgroundColor: '#fff5f6',
  },
  radioOptionLarge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  radioOptionLargeSelected: {
    borderColor: '#ff5864',
    backgroundColor: '#fff5f6',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#ff5864',
  },
  radioSelected: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#ff5864',
  },
  radioLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    fontFamily: 'Poppins-SemiBold',
  },
  radioLabelSelected: {
    color: '#ff5864',
  },
  radioDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 14,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  link: {
    color: '#ff5864',
  },
  nextButton: {
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
  nextButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

