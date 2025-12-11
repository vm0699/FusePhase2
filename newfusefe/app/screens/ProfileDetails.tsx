import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Input } from './Input';
import { SelectableTag } from '../../components/SelectableTag';
import { CircularNextButton } from '../../components/CircularNextButton';
import { useProfile } from '../../ProfileContext';

const HEIGHTS = Array.from({ length: 101 }, (_, i) => 120 + i);

const INTERESTS = [
  { emoji: '🕯️', label: 'Aromatherapy' }, { emoji: '🌠', label: 'Astrology' }, { emoji: '❄️', label: 'Cold plunging' },
  { emoji: '💎', label: 'Crystals' }, { emoji: '💬', label: 'Deep chats' }, { emoji: '✍', label: 'Journalling' },
  { emoji: '🧠', label: 'Mindfulness' }, { emoji: '🥦', label: 'Nutrition' }, { emoji: '🤸‍♂️', label: 'Gym' },
  { emoji: '🏈', label: 'American football' }, { emoji: '🏊', label: 'Athletics' }, { emoji: '🏋️', label: 'Badminton' },
  { emoji: '⚾', label: 'Baseball' }, { emoji: '🏀', label: 'Basketball' }, { emoji: '💪', label: 'Bodybuilding' },
  { emoji: '🧓', label: 'Bouldering' }, { emoji: '🎨', label: 'Art' }, { emoji: '🔊', label: 'Crafts' },
  { emoji: '🧾', label: 'Crocheting' }, { emoji: '💃', label: 'Dancing' }, { emoji: '🖊️', label: 'Design' },
  { emoji: '🖋️', label: 'Drawing' }, { emoji: '👗', label: 'Fashion' }, { emoji: '🧵', label: 'Knitting' },
  { emoji: '🍻', label: 'Bars' }, { emoji: '☕️', label: 'Cafe-hopping' }, { emoji: '🏆', label: 'Drag shows' },
  { emoji: '🎉', label: 'Festivals' }, { emoji: '🍿', label: 'Films' }, { emoji: '🎟', label: 'Gigs' },
  { emoji: '👩‍🎤', label: 'Improv' }, { emoji: '🎤', label: 'Karaoke' }, { emoji: '🤖', label: 'AI' },
  { emoji: '🍰', label: 'Baking' }, { emoji: '🎲', label: 'Board games' }, { emoji: '♘', label: 'Chess' },
  { emoji: '🍽️', label: 'Cooking' }, { emoji: '🌱', label: 'Gardening' }, { emoji: '🌿', label: 'House plants' },
  { emoji: '🎙️', label: 'Podcasts' }, { emoji: '📺', label: 'Action & adventure' }, { emoji: '📺', label: 'Animated' },
  { emoji: '📺', label: 'Anime' }, { emoji: '📺', label: 'Bollywood' }, { emoji: '📺', label: 'Comedy' },
  { emoji: '📺', label: 'Cooking shows' }, { emoji: '📺', label: 'Crime' }, { emoji: '📺', label: 'Documentaries' },
  { emoji: '📖', label: 'Biographies' }, { emoji: '📖', label: 'Classics' }, { emoji: '📖', label: 'Comic books' },
  { emoji: '📖', label: 'Fantasy' }, { emoji: '📖', label: 'History' }, { emoji: '🎵', label: 'Afro' },
  { emoji: '🎵', label: 'Arab' }, { emoji: '🎵', label: 'Blues' }, { emoji: '🎵', label: 'Classical' },
  { emoji: '🎵', label: 'Country' }, { emoji: '🎵', label: 'Desi' }, { emoji: '🎵', label: 'EDM' },
  { emoji: '🎵', label: 'Electronic' }, { emoji: '🍺', label: 'Beer' }, { emoji: '🍗', label: 'BBQ' },
  { emoji: '🍟', label: 'Biryani' }, { emoji: '🧋', label: 'Boba tea' }, { emoji: '🍔', label: 'Burgers' },
  { emoji: '🍰', label: 'Cake' }, { emoji: '🍹', label: 'Cocktails' },
  { emoji: '🌆', label: 'City breaks' }, { emoji: '🚵', label: 'Backpacking' }, { emoji: '🏖️', label: 'Beaches' },
  { emoji: '🏕️', label: 'Camping' }, { emoji: '🏡', label: 'Country escapes' }, { emoji: '🎣', label: 'Fishing trips' },
  { emoji: '🏔', label: 'Hiking trips' }, { emoji: '🚌', label: 'Road trips' },
];

const VALUES = [
  'Ambition', 'Confidence', 'Empathy', 'Generosity', 'Humour',
  'Kindness', 'Openness', 'Optimism', 'Playfulness', 'Sassiness',
  'Leadership', 'Curiosity', 'Gratitude', 'Humility', 'Loyalty',
  'Sarcasm', 'Emotional intelligence',
];

export default function ProfileDetailsPage({ navigation }) {
  const { profileData, updateNestedProfileData } = useProfile();
  const { profileDetails } = profileData;

  const [height, setHeight] = useState(profileDetails.height || 168);
  const [selectedInterests, setSelectedInterests] = useState(profileDetails.interests || []);
  const [selectedValues, setSelectedValues] = useState(profileDetails.values || []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInterests = INTERESTS.filter((interest) =>
    interest.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleInterest = (label) => {
    const entry = INTERESTS.find((i) => i.label === label);
    if (!entry) return;

    const full = `${entry.emoji} ${entry.label}`;

    setSelectedInterests((prev) => {
      if (prev.includes(full)) {
        return prev.filter((i) => i !== full);
      }
      if (prev.length >= 5) return prev;
      return [...prev, full];
    });
  };

  const toggleValue = (value) => {
    setSelectedValues((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  };

  const isComplete = height && selectedInterests.length > 0 && selectedValues.length > 0;

  const handleNext = () => {
    updateNestedProfileData('profileDetails', 'height', height);
    updateNestedProfileData('profileDetails', 'interests', selectedInterests);
    updateNestedProfileData('profileDetails', 'values', selectedValues);
    navigation.navigate('PromptSelection');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Now, let's talk about you</Text>
          <Text style={styles.subtitle}>
            Let's get the small talk out of the way. We'll get into the deep and meaningful later.
          </Text>
        </View>

        {/* Height Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your height</Text>
          <ScrollView style={styles.heightScroll} nestedScrollEnabled>
            {HEIGHTS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHeight(h)}
                style={[
                  styles.heightOption,
                  height === h && styles.heightOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.heightText,
                    height === h && styles.heightTextSelected,
                  ]}
                >
                  {h} cm
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Interests Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose 5 things you're really into</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you into?"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <View style={styles.tagContainer}>
            {filteredInterests.map((interest) => {
              const full = `${interest.emoji} ${interest.label}`;
              return (
                <SelectableTag
                  key={full}
                  selected={selectedInterests.includes(full)}
                  onPress={() => toggleInterest(interest.label)}
                  disabled={
                    selectedInterests.length >= 5 &&
                    !selectedInterests.includes(full)
                  }
                >
                  {interest.emoji} {interest.label}
                </SelectableTag>
              );
            })}
          </View>
          <Text style={styles.counter}>{selectedInterests.length}/5 selected</Text>
        </View>

        {/* Values Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us what you value in a person</Text>
          <View style={styles.tagContainer}>
            {VALUES.map((value) => (
              <SelectableTag
                key={value}
                selected={selectedValues.includes(value)}
                onPress={() => toggleValue(value)}
                disabled={
                  selectedValues.length >= 3 && !selectedValues.includes(value)
                }
              >
                {value}
              </SelectableTag>
            ))}
          </View>
          <Text style={styles.counter}>{selectedValues.length}/3 selected</Text>
        </View>
      </ScrollView>

      <CircularNextButton
        disabled={!isComplete}
        onPress={handleNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heightScroll: {
    maxHeight: 300,
  },
  heightOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  heightOptionSelected: {
    backgroundColor: '#ff5864',
  },
  heightText: {
    color: '#666',
  },
  heightTextSelected: {
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  counter: {
    marginTop: 10,
    color: '#666',
  },
});
