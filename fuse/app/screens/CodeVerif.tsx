import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStore } from '../auth/authStore';
import OnboardingStepper from '../../components/OnboardingStepper';
import { API_BASE_URL } from '../config/env';

export default function VerifyCodePage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, countryCode } = route.params;

  const inputRefs = useRef([]);
  inputRefs.current = Array(6)
    .fill(1)
    .map((_, i) => inputRefs.current[i] ?? React.createRef());

  useEffect(() => {
    console.log('🟣 [VerifyCode] mounted');
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    if (value !== '' && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (index, e) => {
    const key = e?.nativeEvent?.key;

    if (key === 'Backspace') {
      if (code[index] !== '') {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        return;
      }

      if (index > 0) {
        inputRefs.current[index - 1].current?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      }
    }
  };

  useEffect(() => {
    if (timer === 0) return;
    const timerId = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timer]);

  const isComplete = code.every((digit) => digit !== '');

  const verifyOTPCode = async () => {
    try {
      console.log('🟣 [VerifyCode] VERIFY OTP clicked');

      let fullPhoneNumber = `+${countryCode}${phoneNumber}`;
      fullPhoneNumber = fullPhoneNumber.replace(/^(\+91)(\+91)?/, '+91');

      console.log('🟣 [VerifyCode] Sending verifyCode for:', fullPhoneNumber);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/verifyCode`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: fullPhoneNumber,
            code: code.join(''),
          }),
        }
      );

      console.log('🟣 [VerifyCode] verifyCode response status:', response.status);

      const result = await response.json();
      console.log('🟣 [VerifyCode] verifyCode response JSON:', result);

      if (!result.success) {
        Alert.alert('Error', result.message || 'Invalid OTP');
        return;
      }

      // ✅ Save JWT
      // ✅ Save access + refresh tokens (CRITICAL for auto-login)
      if (result?.data?.accessToken) {
        console.log('🟢 [VerifyCode] Saving access + refresh tokens');

        await authStore.setTokens({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken || null,
        });
      } else {
        console.log('🟥 [VerifyCode] NO accessToken received');
      }


      // ✅ Save userId
      if (result?.data?.user?.id) {
        console.log('🟢 [VerifyCode] Saving userId:', result.data.user.id);
        await AsyncStorage.setItem('userId', String(result.data.user.id));
      }

      // ✅ Save username only if non-empty
      if (
        typeof result?.data?.user?.username === 'string' &&
        result.data.user.username.length > 0
      ) {
        console.log('🟢 [VerifyCode] Saving username:', result.data.user.username);
        await AsyncStorage.setItem('username', result.data.user.username);
      } else {
        console.log('🟠 [VerifyCode] Username empty or missing');
      }

      await AsyncStorage.removeItem('popup_shown_this_session');

      Alert.alert('Success', 'OTP verified successfully.');

      const onboardingStage = result?.data?.onboardingStage;

      console.log('🟢 [VerifyCode] Onboarding stage:', onboardingStage);

      // ✅ CORRECT BRANCHING
      if (onboardingStage === 'COMPLETE') {
        console.log('➡️ [VerifyCode] Existing user → SwipeView');
        navigation.reset({
          index: 0,
          routes: [{ name: 'SwipeView' }],
        });
      } else {
        console.log('➡️ [VerifyCode] New/incomplete user → AuthGate');
        navigation.reset({
          index: 0,
          routes: [{ name: 'AuthGate' }],
        });
      }
    } catch (error) {
      console.error('❌ [VerifyCode] Error verifying OTP:', error);
      Alert.alert(
        'Error',
        `An error occurred while verifying the OTP: ${error.message}`
      );
    }
  };



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <OnboardingStepper currentStep={2} totalSteps={26} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.description}>
              Enter the code we've sent by text to {phoneNumber}.
            </Text>

            <View style={styles.codeInputContainer}>
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <TextInput
                    key={index}
                    style={styles.inputField}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={code[index]}
                    onChangeText={(value) => handleCodeChange(index, value)}
                    onKeyPress={(e) => handleKeyPress(index, e)}
                    ref={inputRefs.current[index]}
                    returnKeyType="next"
                  />
                ))}
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.changeNumber}>Change number</Text>
            </TouchableOpacity>

            <Text style={styles.timerText}>
              This code should arrive within {timer}s
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.nextButton,
            isComplete && timer > 0 ? styles.activeButton : styles.disabledButton,
          ]}
          onPress={verifyOTPCode}
          disabled={!isComplete || timer <= 0}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    fontFamily: 'Poppins',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  inputField: {
    width: 50,
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  changeNumber: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  timerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  nextButton: {
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
  activeButton: {
    backgroundColor: '#ff5864'
  },
  disabledButton: {
    backgroundColor: '#ff5864',
    opacity: 0.4
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-Bold',
  },
});
