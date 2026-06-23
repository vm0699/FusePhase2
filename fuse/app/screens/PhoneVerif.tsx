import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import { ProfileContext } from '../../ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingStepper from '../../components/OnboardingStepper';
import Button from '../../components/ui/Button';
import { API_BASE_URL } from '../config/env';

export default function PhoneVerificationPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [countryCode, setCountryCode] = useState('91');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const navigation = useNavigation();
  const { updateProfileData } = useContext(ProfileContext);

  const validatePhoneNumber = (number) => /^[0-9]{8,15}$/.test(number);

  const handlePhoneInput = (number) => {
    setPhoneNumber(number);
    setIsPhoneValid(validatePhoneNumber(number));
  };

  const handlePhoneSubmit = async () => {
    if (!isPhoneValid) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    try {
      const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

      console.log('🟣 [PhoneVerif] SUBMIT pressed');
      console.log('🟣 [PhoneVerif] Full phone number:', fullPhoneNumber);

      await AsyncStorage.setItem('fullPhoneNumber', fullPhoneNumber);

      updateProfileData('number', fullPhoneNumber);



      // ❌ DO NOT save jwtToken here
      // ❌ DO NOT route via AuthGate here

      console.log('🟢 [PhoneVerif] Phone accepted — showing OTP confirm modal');
      setShowVerification(true);
    } catch (error) {
      console.error('❌ [PhoneVerif] Error checking phone number:', error);
      Alert.alert('Error', 'An error occurred while verifying the phone number.');
    }
  };

  const handleSendOTP = async () => {
    setIsSending(true);
    try {
      const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

      console.log('🟣 [PhoneVerif] SEND OTP clicked for:', fullPhoneNumber);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/verifyPhoneNumber`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: fullPhoneNumber }),
        }
      );

      console.log('🟣 [PhoneVerif] send OTP status:', response.status);

      const result = await response.json();
      console.log('🟣 [PhoneVerif] send OTP response:', result);

      if (!result.success) {
        setIsSending(false);
        setShowVerification(false);
        Alert.alert('Error', result.message || 'Failed to send OTP');
        return;
      }

      // 🆕 Initialize empty profile ONLY for new users
      if (!result.data.exists) {
        console.log('🟢 [PhoneVerif] New user detected — initializing profile');
        updateProfileData({
          number: fullPhoneNumber,
          intro: { name: '', dob: '' },
          options: { username: '', gender: '', reason: '' },
          profileDetails: { height: '', interests: [], values: [] },
          prompts: [],
          photos: [],
        });
      } else {
        console.log('🟢 [PhoneVerif] Existing user detected');
      }

      navigation.navigate('CodeVerif', {
        phoneNumber: fullPhoneNumber,
        countryCode,
      });
    } catch (error) {
      console.error('❌ [PhoneVerif] Verification Error:', error);
      setIsSending(false);
      setShowVerification(false);
      Alert.alert('Error', 'An error occurred while verifying the phone number.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <OnboardingStepper currentStep={1} totalSteps={26} />
        <Text style={styles.title}>What's your{'\n'}number?</Text>

        <View style={styles.inputContainer}>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              value={countryCode}
              onValueChange={setCountryCode}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              items={[
                { label: 'India +91', value: '91' },
                { label: 'USA +1', value: '1' },
                { label: 'UK +44', value: '44' },
              ]}
            />
          </View>

          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneInput}
          />
        </View>

        <Text style={styles.verificationMessage}>
          Fuse will send a verification code to this number
        </Text>

        <View style={styles.submitButton}>
          <Button
            label="Continue"
            onPress={handlePhoneSubmit}
            disabled={!isPhoneValid}
          />
        </View>

        <Modal
          visible={showVerification}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (!isSending) setShowVerification(false);
            }}
          >
            <View style={styles.modalBackground}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHandle} />

                  <Text style={styles.modalHeading}>Confirm your number</Text>
                  <Text style={styles.modalSubtext}>
                    We'll send a verification code to
                  </Text>

                  <View style={styles.modalPhoneRow}>
                    <Text style={styles.modalPhoneNumber}>
                      +{countryCode} {phoneNumber}
                    </Text>
                  </View>

                  <Button
                    label="Send OTP"
                    loadingLabel="Sending code…"
                    loading={isSending}
                    onPress={handleSendOTP}
                    style={styles.modalButton}
                  />

                  <TouchableOpacity
                    onPress={() => {
                      if (!isSending) setShowVerification(false);
                    }}
                    style={styles.modalEditRow}
                    disabled={isSending}
                  >
                    <Text
                      style={[
                        styles.modalEditText,
                        isSending && { opacity: 0.4 },
                      ]}
                    >
                      Edit number
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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

  title: {
    fontSize: 48,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 30,
    marginTop: 50,
    textAlign: 'left',
    fontFamily: 'Poppins',
    lineHeight: 56,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
    gap: 12,
  },
  verificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    marginTop: -5,
    paddingHorizontal: 4,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingLeft: 15,
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

  // Modal — bottom sheet
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 44,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 28,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalPhoneRow: {
    backgroundColor: '#FAF8F3',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 28,
  },
  modalPhoneNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  modalButton: {
    marginBottom: 16,
  },
  modalEditRow: {
    paddingVertical: 6,
  },
  modalEditText: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Poppins',
    textDecorationLine: 'underline',
  },
  pickerWrapper: {
    width: 130,
    height: 56,
    borderColor: '#ff5864',
    borderWidth: 1.5,
    borderRadius: 20,
    justifyContent: 'center',
    paddingLeft: 10,
    backgroundColor: '#ffffff',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 56,
    borderColor: '#acb7ae',
    paddingLeft: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputAndroid: {
    height: 56,
    borderColor: '#acb7ae',
    paddingLeft: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
});
