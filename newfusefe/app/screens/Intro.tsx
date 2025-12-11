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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../ProfileContext';

const IntroPage = () => {
  const { updateNestedProfileData } = useContext(ProfileContext);
  const [firstName, setFirstName] = useState('');
  const [birthday, setBirthday] = useState({ day: '', month: '', year: '' });
  const [isDOBValid, setIsDOBValid] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(true);

  const navigation = useNavigation();

  const validateDate = () => {
    const { day, month, year } = birthday;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    const maxYear = currentYear - 18;

    if (
      !dayNum || !monthNum || !yearNum ||
      monthNum < 1 || monthNum > 12 ||
      dayNum < 1 || dayNum > 31 ||
      yearNum < minYear || yearNum > maxYear
    ) {
      return false;
    }

    const date = new Date(yearNum, monthNum - 1, dayNum);
    return (
      date.getFullYear() === yearNum &&
      date.getMonth() === monthNum - 1 &&
      date.getDate() === dayNum
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

  const handleNext = () => {
    if (isComplete) {
      updateNestedProfileData('intro', 'name', firstName.trim());
      updateNestedProfileData(
        'intro',
        'dob',
        `${birthday.day.padStart(2, '0')}-${birthday.month.padStart(2, '0')}-${birthday.year}`
      );
      navigation.navigate('ProfileSetup');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.header}>Handshakes?</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your Name"
              placeholderTextColor="#aaa"
            />
          </View>

          <Text style={styles.label}>Your birthday</Text>

          <View style={styles.dateContainer}>
            <TextInput
              style={[styles.dateInput, !isDOBValid && birthday.day !== '' && styles.invalidInput]}
              value={birthday.day}
              onChangeText={(value) => handleInputChange('day', value)}
              placeholder="DD"
              maxLength={2}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.dateInput, !isDOBValid && birthday.month !== '' && styles.invalidInput]}
              value={birthday.month}
              onChangeText={(value) => handleInputChange('month', value)}
              placeholder="MM"
              maxLength={2}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.dateInput, !isDOBValid && birthday.year !== '' && styles.invalidInput]}
              value={birthday.year}
              onChangeText={(value) => handleInputChange('year', value)}
              placeholder="YYYY"
              maxLength={4}
              keyboardType="numeric"
            />
          </View>

          {!isDOBValid && (
            <Text style={styles.errorText}>
              Please enter a valid date of birth (you must be 18+).
            </Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, { opacity: isComplete ? 1 : 0.5 }]}
        onPress={handleNext}
        disabled={!isComplete}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      {/* 🔔 Modal Warning */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⚠️ Don’t Exit Yet</Text>
            <Text style={styles.modalMessage}>
              Your profile will only be saved after you complete all steps and accept the guidelines.{"\n\n"}
              Exiting now may result in data loss, and some details cannot be changed later.
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  content: { maxWidth: 400, alignSelf: 'center' },
  header: { fontSize: 32, fontWeight: 'bold', color: 'black', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { color: 'black', fontWeight: '500', marginBottom: 8 },
  input: {
    height: 40, borderColor: '#acb7ae', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, fontSize: 16, color: 'black',
  },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dateInput: {
    width: 80, height: 40, borderColor: '#acb7ae', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, fontSize: 16, textAlign: 'center', color: 'black',
  },
  invalidInput: { borderColor: 'red' },
  errorText: { color: 'red', marginTop: 8, fontSize: 12 },
  button: {
    backgroundColor: '#ff5864', paddingVertical: 12, borderRadius: 20,
    alignItems: 'center', marginTop: 10, marginBottom: 50, alignSelf: 'center', width: '90%',
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // 🔔 Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff", padding: 24, borderRadius: 16,
    width: "100%", maxWidth: 320, alignItems: "center",
  },
  modalTitle: {
    fontSize: 20, fontWeight: "bold", color: "#e11d48", marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16, color: "#111827", marginBottom: 20, textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#e11d48", paddingVertical: 10,
    paddingHorizontal: 24, borderRadius: 10,
  },
  modalButtonText: {
    color: "#fff", fontWeight: "bold", fontSize: 16,
  },
});

export default IntroPage;
