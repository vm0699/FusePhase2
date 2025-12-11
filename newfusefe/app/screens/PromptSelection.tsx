import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../ProfileContext'; // Corrected import for ProfileContext

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
  const { profileData, updateProfileData } = useProfile(); // Updated to use correct hook
  const [activeCategory, setActiveCategory] = useState('Looking for');
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');

  const selectedPrompts = profileData.prompts || [];

  // Handle prompt selection
  const handlePromptSelect = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  // Save the selected prompt and answer
  const handleSavePrompt = () => {
    if (currentPrompt && currentAnswer.trim()) {
      const updatedPrompts =
        selectedPrompts.length >= 3
          ? [...selectedPrompts.slice(1), { question: currentPrompt, answer: currentAnswer.trim() }]
          : [...selectedPrompts, { question: currentPrompt, answer: currentAnswer.trim() }];

      updateProfileData('prompts', updatedPrompts); // Update profile context
      setCurrentPrompt(null);
      setCurrentAnswer('');
    }
  };

  // Clear all selected prompts
  const handleClearAll = () => {
    updateProfileData('prompts', []);
  };

  const isComplete = selectedPrompts.length === 3;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Tell us about yourself</Text>
        <Text style={styles.subHeader}>
          Choose and answer up to 3 prompts to show on your profile.
        </Text>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
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

      {/* Prompts List */}
      <FlatList
        data={PROMPT_CATEGORIES[activeCategory as keyof typeof PROMPT_CATEGORIES]}
        keyExtractor={(item) => item}
        renderItem={({ item: prompt }) => (
          <TouchableOpacity
            onPress={() => handlePromptSelect(prompt)}
            disabled={
              selectedPrompts.length >= 3 &&
              !selectedPrompts.some((p) => p.question === prompt)
            }
            style={[
              styles.promptButton,
              selectedPrompts.some((p) => p.question === prompt)
                ? styles.selectedPrompt
                : styles.unselectedPrompt,
            ]}
          >
            <Text style={styles.promptText}>{prompt}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        )}
      />

      {/* Selected Prompts */}
      <View style={styles.selectedPromptsContainer}>
        <Text style={styles.selectedHeader}>Your selected prompts:</Text>
        {selectedPrompts.map((prompt, index) => (
          <View key={index} style={styles.selectedPromptCard}>
            <Text style={styles.selectedPromptQuestion}>{prompt.question}</Text>
            <Text style={styles.selectedPromptAnswer}>{prompt.answer}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>Clear all</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>{selectedPrompts.length}/3 added</Text>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          !isComplete && styles.disabledNextButton,
        ]}
        disabled={!isComplete}
        onPress={() => navigation.navigate('PhotoUpload')}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      {/* Dialog Modal */}
      <Modal transparent visible={!!currentPrompt} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentPrompt}</Text>
            <TextInput
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setCurrentPrompt(null)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePrompt} disabled={!currentAnswer.trim()}>
                <Text style={[styles.modalSave, !currentAnswer.trim() && styles.disabledSave]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },

  // 1. Lower the heading
  headerContainer: { marginTop: 25, marginBottom: 16 },

  header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subHeader: { fontSize: 14, color: '#777' },

  // 2. Resize and recolor category pills
categoryContainer: {
  flexDirection: 'row',
  marginBottom: -60,
},

categoryButton: {
  height: 50,                   // ✅ Fixed height for compact bubble
  paddingHorizontal: 12,       // ✅ Slightly increased for balance
  marginHorizontal: 6,
  borderRadius: 12,
  backgroundColor: '#eee',
  justifyContent: 'center',    // ✅ Vertically center text
},
  activeCategoryButton: {
    backgroundColor: '#ff5864', // ✅ App color
  },
  categoryText: { fontSize: 14, color: '#555' },
  activeCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  promptText: { flex: 1, fontSize: 16, color: '#333' },
  selectedPrompt: { backgroundColor: '#e0f7fa' },
  unselectedPrompt: { backgroundColor: '#fff' },

  selectedPromptsContainer: { marginTop: 16 },
  selectedHeader: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  selectedPromptCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  selectedPromptQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedPromptAnswer: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  clearButton: { color: '#f44336', fontSize: 14 },
  countText: { fontSize: 14, color: '#555' },

  // 3. Update next button color and position
  nextButton: {
  marginTop: 16,
  marginBottom: 20,
  paddingVertical: 14,
  backgroundColor: '#ff5864',
  borderRadius: 10,
  alignSelf: 'stretch',   // full width inside the 16px-padded container
},
  disabledNextButton: { backgroundColor: '#ff586480' },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancel: { fontSize: 14, color: '#f44336' },
  modalSave: { fontSize: 14, color: '#4CAF50' },
  disabledSave: { color: '#ccc' },
});
