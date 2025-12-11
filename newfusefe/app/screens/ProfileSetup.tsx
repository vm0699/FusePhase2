import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../ProfileContext'; // Import the ProfileContext

export default function ProfileSetupPage() {
  const navigation = useNavigation();
  const { profileData, updateProfileData } = useContext(ProfileContext); // Access context
  const [localProfile, setLocalProfile] = useState({
    username: profileData.options.username || '',
    gender: profileData.options.gender || '',
    mode: profileData.options.reason || '',
  });

  const [isUsernameValid, setIsUsernameValid] = useState(
    localProfile.username.length >= 8 && localProfile.username.length <= 15
  );

  const validateUsername = (text) => {
    setLocalProfile({ ...localProfile, username: text });
    if (text.length >= 8 && text.length <= 15) {
      setIsUsernameValid(true);
    } else {
      setIsUsernameValid(false);
    }
  };

  const isComplete = localProfile.gender !== '' && localProfile.mode !== '' && isUsernameValid;

  const handleNavigate = () => {
    if (isComplete) {
      updateProfileData('options', { ...profileData.options, ...localProfile }); // Update global profile context
      navigation.navigate('ProfileDetails'); // Adjust with your actual navigation route
    }
  };

  return (
    <View style={styles.container}>
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
              <Text style={styles.title}>Welcome to Fuse!</Text>
              <Text style={styles.subtitle}>Let's set up your profile.</Text>
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
                placeholder="Enter your Username"
                placeholderTextColor="#999"
              />
              {localProfile.username.length > 0 && !isUsernameValid && (
                <Text style={styles.errorText}>Username must be between 8-15 characters.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Which gender best describes you?</Text>
              {['Woman', 'Man', 'Nonbinary'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[ 
                    styles.radioOption, 
                    localProfile.gender === option && styles.radioOptionSelected,
                  ]}
                  onPress={() => setLocalProfile({ ...localProfile, gender: option })}
                >
                  <View style={styles.radioCircle}>
                    {localProfile.gender === option && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>{option}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.note}>
                You can always update this later.{' '}
                <Text style={styles.link}>A note about gender on Fuse.</Text>
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What brings you to Fuse?</Text>
              <Text style={styles.sectionSubtitle}>
                Romance and butterflies or a beautiful friendship? Choose a mode to
                find your people.
              </Text>
              {[
                { value: 'Date', label: 'Date', description: 'Find a relationship, something casual, or anything in-between' },
                { value: 'BFF', label: 'BFF', description: 'Make new friends and find your community' },
                { value: 'Bizz', label: 'Bizz', description: 'Network professionally and make career moves' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[ 
                    styles.radioOptionLarge, 
                    localProfile.mode === option.value && styles.radioOptionSelected,
                  ]}
                  onPress={() => setLocalProfile({ ...localProfile, mode: option.value })}
                >
                  <View style={styles.radioCircle}>
                    {localProfile.mode === option.value && <View style={styles.radioSelected} />}
                  </View>
                  <View>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                    <Text style={styles.radioDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <Text style={styles.note}>
                You'll only be shown to people in the same mode as you.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Next Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !isComplete && styles.nextButtonDisabled]}
            onPress={handleNavigate}
            disabled={!isComplete}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60, // Add space for the sticky footer
  },
  innerContainer: {
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  inputInvalid: {
    borderColor: 'red',
  },
  inputValid: {
    borderColor: 'green',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioOptionLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  radioOptionSelected: {
    borderColor: '#007BFF',
    backgroundColor: '#E6F0FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007BFF',
  },
  radioLabel: {
    fontSize: 16,
  },
  radioDescription: {
    fontSize: 14,
    color: '#666',
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: '#ff5864',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ff586480',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
