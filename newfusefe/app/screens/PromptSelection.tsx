import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../ProfileContext';
import OnboardingStepper from '../../components/OnboardingStepper';

const BASE_URL = 'http://172.20.10.4:5000';
const ONBOARDING_STEP_KEY = '@onboarding_step'; // 🔹 2.1

const PROMPT_CATEGORIES = {
  'Looking for': [
    "I'm looking for someone who",
    "My ideal match would be",
    "We'd get along if you",
  ],
  'Date night': [
    "My idea of a perfect date is",
    "I know the best spot in town for",
    "Let's grab a drink and",
  ],
  'Real talk': [
    "A cause I care about is",
    "A life goal of mine is",
    "My most controversial opinion is",
  ],
  'Fun facts': [
    "Two truths and a lie",
    "The most spontaneous thing I've done is",
    "A skill I'd like to learn is",
  ],
};

export default function PromptSelectionPage({ navigation }) {
  const { profileData, updateProfileData } = useProfile();

  // 🔹 2.1 — persist current onboarding step (LOCAL resume)
  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'PromptSelection');
  }, []);

  const [activeCategory, setActiveCategory] = useState('Looking for');
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');

  const selectedPrompts = profileData.prompts || [];

  const handlePromptSelect = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handleSavePrompt = () => {
    if (currentPrompt && currentAnswer.trim()) {
      const updatedPrompts =
        selectedPrompts.length >= 3
          ? [
            ...selectedPrompts.slice(1),
            { question: currentPrompt, answer: currentAnswer.trim() },
          ]
          : [
            ...selectedPrompts,
            { question: currentPrompt, answer: currentAnswer.trim() },
          ];

      updateProfileData('prompts', updatedPrompts);
      setCurrentPrompt(null);
      setCurrentAnswer('');
    }
  };

  const handleClearAll = () => {
    updateProfileData('prompts', []);
  };

  const isComplete = selectedPrompts.length === 3;

  const handleNext = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) return;

    // =====================================================
    // 🔥 2.1 CORE CHANGE — BACKEND CHECKPOINT SAVE
    // Saves prompts + onboardingStage = PROMPTS_DONE
    // =====================================================
    await fetch(`${BASE_URL}/api/profile/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        updates: {
          prompts: selectedPrompts,
          onboardingStage: 'PROMPTS_DONE', // ✅ backend checkpoint
        },
      }),
    });
    // =====================================================

    // 🔹 2.1 — advance local resume pointer
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'PhotoUpload');

    navigation.navigate('PhotoUpload');
  };

  return (
    <View style={styles.container}>
      <OnboardingStepper currentStep={7} totalSteps={26} />
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Tell your{'\n'}story</Text>
        <Text style={styles.subHeader}>
          Answer 3 prompts to show on your profile.
        </Text>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}
      >
        {Object.keys(PROMPT_CATEGORIES).map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setActiveCategory(category)}
            style={[
              styles.categoryButton,
              activeCategory === category && styles.activeCategoryButton,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.activeCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Prompts */}
      <FlatList
        data={PROMPT_CATEGORIES[activeCategory as keyof typeof PROMPT_CATEGORIES]}
        keyExtractor={(item) => item}
        style={styles.promptList}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePromptSelect(item)}
            disabled={
              selectedPrompts.length >= 3 &&
              !selectedPrompts.some((p) => p.question === item)
            }
            style={[
              styles.promptButton,
              selectedPrompts.some((p) => p.question === item)
                ? styles.selectedPrompt
                : styles.unselectedPrompt,
            ]}
          >
            <Text style={[
              styles.promptText,
              selectedPrompts.some((p) => p.question === item) && styles.promptTextSelected,
            ]}>{item}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={selectedPrompts.some((p) => p.question === item) ? '#ff5864' : '#D1D5DB'}
            />
          </TouchableOpacity>
        )}
      />

      {/* Selected Prompts */}
      {selectedPrompts.length > 0 && (
        <View style={styles.selectedPromptsContainer}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedHeaderText}>Your prompts</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearButton}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {selectedPrompts.map((prompt, index) => (
            <View key={index} style={styles.selectedPromptCard}>
              <Text style={styles.selectedPromptQuestion}>{prompt.question}</Text>
              <Text style={styles.selectedPromptAnswer}>{prompt.answer}</Text>
            </View>
          ))}
          <Text style={styles.countText}>{selectedPrompts.length}/3 added</Text>
        </View>
      )}

      {/* Next */}
      <TouchableOpacity
        style={[styles.nextButton, !isComplete && styles.disabledNextButton]}
        disabled={!isComplete}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal transparent visible={!!currentPrompt} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentPrompt}</Text>
            <TextInput
              placeholder="Your answer..."
              placeholderTextColor="#9ca3af"
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              style={styles.input}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCurrentPrompt(null)}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !currentAnswer.trim() && styles.modalSaveBtnDisabled]}
                onPress={handleSavePrompt}
                disabled={!currentAnswer.trim()}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F3', paddingTop: 60 },
  headerContainer: { marginTop: 8, marginBottom: 20, paddingHorizontal: 24 },
  header: {
    fontSize: 44,
    fontWeight: '300',
    color: '#1a1a1a',
    fontFamily: 'Poppins',
    lineHeight: 52,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Poppins',
  },

  categoryContainer: { marginBottom: 16, flexGrow: 0 },
  categoryButton: {
    height: 40,
    paddingHorizontal: 18,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  activeCategoryButton: {
    backgroundColor: '#ff5864',
    borderColor: '#ff5864',
  },
  categoryText: { fontSize: 14, color: '#6B7280', fontFamily: 'Poppins' },
  activeCategoryText: { color: '#fff', fontFamily: 'Poppins-SemiBold' },

  promptList: { flexGrow: 0, maxHeight: 220 },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontFamily: 'Poppins',
  },
  promptTextSelected: {
    color: '#ff5864',
    fontFamily: 'Poppins-SemiBold',
  },
  selectedPrompt: {
    backgroundColor: '#fff5f6',
    borderColor: '#ff5864',
  },
  unselectedPrompt: {
    backgroundColor: '#ffffff',
    borderColor: '#F3F4F6',
  },

  selectedPromptsContainer: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins-SemiBold',
  },
  selectedPromptCard: {
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  selectedPromptQuestion: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  selectedPromptAnswer: {
    fontSize: 15,
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
  },

  clearButton: {
    color: '#ff5864',
    fontSize: 13,
    fontFamily: 'Poppins',
  },
  countText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
    fontFamily: 'Poppins',
  },

  nextButton: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 18,
    backgroundColor: '#ff5864',
    borderRadius: 28,
    alignItems: 'center',
  },
  disabledNextButton: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    padding: 24,
    backgroundColor: '#FAF8F3',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1a1a1a',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  input: {
    height: 100,
    borderWidth: 1.5,
    borderColor: '#ff5864',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'Poppins',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancel: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Poppins-SemiBold',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#ff5864',
    alignItems: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.4,
  },
  modalSave: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  disabledSave: { color: '#ccc' },
});

