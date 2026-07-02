/**
 * EmailEntryScreen — "Continue with email" shortcut off PhoneVerif.
 *
 * This is a login shortcut for users who already linked an email to
 * their account via Settings — it is NOT a new-account signup path.
 * If no account is found for the email, the user is told to use their
 * phone number instead. Deliberately has no OnboardingStepper since it's
 * a deroute off the main onboarding flow, not a forward step in it.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../config/env';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailEntryScreen() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const navigation = useNavigation();

  const isEmailValid = EMAIL_REGEX.test(email.trim());

  const handleContinue = async () => {
    if (!isEmailValid) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sendEmailOTP`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = await response.json();

      if (!result.success) {
        setIsSending(false);
        Alert.alert('Error', result.message || 'Failed to send code.');
        return;
      }

      (navigation as any).navigate('EmailCodeVerif', { email: normalizedEmail });
    } catch (error) {
      console.error('❌ [EmailEntry] Error sending email OTP:', error);
      setIsSending(false);
      Alert.alert('Error', 'An error occurred while sending the code.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Log in with{'\n'}your email</Text>
        <Text style={styles.subtitle}>
          Only works if you've already linked an email to your account in Settings.
        </Text>

        <TextInput
          style={styles.emailInput}
          placeholder="Email address"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.submitButton}>
          <Button
            label="Send code"
            loadingLabel="Sending…"
            loading={isSending}
            onPress={handleContinue}
            disabled={!isEmailValid}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    padding: 24,
    paddingTop: 60,
  },
  backRow: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
  },
  title: {
    fontSize: 40,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'left',
    fontFamily: 'Poppins',
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 28,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  emailInput: {
    height: 56,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingLeft: 18,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    fontFamily: 'Poppins',
  },
  submitButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
});
