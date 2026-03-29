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

const ONBOARDING_STEP_KEY = '@onboarding_step'; // 🔹 2.1

export default function PhoneVerificationPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [countryCode, setCountryCode] = useState('91');
  const [isPhoneValid, setIsPhoneValid] = useState(false);

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

      // 🔹 Save checkpoint ONLY
      await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'PhoneVerif');
      await AsyncStorage.setItem('fullPhoneNumber', fullPhoneNumber);

      console.log('🟣 [PhoneVerif] Saved checkpoint PhoneVerif');

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
    try {
      const fullPhoneNumber = `+${countryCode}${phoneNumber}`;

      console.log('🟣 [PhoneVerif] SEND OTP clicked for:', fullPhoneNumber);

      const response = await fetch(
        'http://172.20.10.4:5000/api/auth/verifyPhoneNumber',
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

      // 🔹 Advance checkpoint → OTP screen
      await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'CodeVerif');
      console.log('🟢 [PhoneVerif] Checkpoint moved → CodeVerif');

      navigation.navigate('CodeVerif', {
        phoneNumber: fullPhoneNumber,
        countryCode,
      });
    } catch (error) {
      console.error('❌ [PhoneVerif] Verification Error:', error);
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

        <TouchableOpacity
          style={[
            styles.submitButton,
            isPhoneValid ? styles.activeButton : styles.disabledButton,
          ]}
          onPress={handlePhoneSubmit}
          disabled={!isPhoneValid}
        >
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>

        <Modal visible={showVerification} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Is this your number? +{countryCode}
                {phoneNumber}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  handleSendOTP();
                  setShowVerification(false);
                }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Send OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  activeButton: { backgroundColor: '#ff5864' },
  disabledButton: { backgroundColor: '#ff5864', opacity: 0.4 },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: '600', fontFamily: 'Poppins-SemiBold' },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },
  modalButton: {
    backgroundColor: '#ff5864',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
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
