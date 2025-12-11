import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type InterestsScreenParams = {
  fromFilter?: boolean;
  onSelect?: (val: string[]) => void;
  currentValue?: string[];
};

const interestsData = {
  "Self-care": ["🕯️ Aromatherapy", "🌠 Astrology", "❄️ Cold plunging", "💎 Crystals", "💬 Deep chats", "✍ Journalling", "🧠 Mindfulness", "🥦 Nutrition"],
  Sports: ["🤸‍♂️ Gym", "🏈 American football", "🏊 Athletics", "🏋️ Badminton", "⚾ Baseball", "🏀 Basketball", "💪 Bodybuilding", "🧓 Bouldering"],
  Creativity: ["🎨 Art", "🔊 Crafts", "🧾 Crocheting", "💃 Dancing", "🖊️ Design", "🖋️ Drawing", "👗 Fashion", "🧵 Knitting"],
  "Going out": ["🍻 Bars", "☕️ Cafe-hopping", "🏆 Drag shows", "🎉 Festivals", "🍿 Films", "🎟 Gigs", "👩‍🎤 Improv", "🎤 Karaoke"],
  "Staying in": ["🤖 AI", "🍰 Baking", "🎲 Board games", "♘ Chess", "🍽️ Cooking", "🌱 Gardening", "🌿 House plants", "🎙️ Podcasts"],
  "Film and TV": ["📺 Action & adventure", "📺 Animated", "📺 Anime", "📺 Bollywood", "📺 Comedy", "📺 Cooking shows", "📺 Crime", "📺 Documentaries"],
  Reading: ["📖 Action & adventure", "📖 Biographies", "📖 Classics", "📖 Comedy", "📖 Comic books", "📖 Crime", "📖 Fantasy", "📖 History"],
  Music: ["🎵 Afro", "🎵 Arab", "🎵 Blues", "🎵 Classical", "🎵 Country", "🎵 Desi", "🎵 EDM", "🎵 Electronic"],
  "Food and drink": ["🍺 Beer", "🍗 BBQ", "🍟 Biryani", "🧋 Boba tea", "🍔 Burgers", "🍰 Cake", "🍸 Cocktails", "🍹 Cocktails"],
  Travelling: ["🌆 City breaks", "🚵 Backpacking", "🏖️ Beaches", "🏕️ Camping", "🏡 Country escapes", "🎣 Fishing trips", "🏔 Hiking trips", "🚌 Road trips"],
};

export default function InterestsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, InterestsScreenParams>, string>>();
  const fromFilter = route.params?.fromFilter || false;

  const [selected, setSelected] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(fromFilter);

  const toggleSelect = (item: string) => {
    setSelected((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      } else if (prev.length < 5) {
        return [...prev, item];
      } else {
        return prev;
      }
    });
  };

  const handleDone = async () => {
    if (fromFilter) {
      await AsyncStorage.setItem("temporaryInterests", JSON.stringify(selected));
    }

    if (typeof route.params?.onSelect === "function") {
      route.params.onSelect(selected);
    }

    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupBubble}>
            <Text style={styles.popupText}>
              Interests selected from here are temporary for swiping.{"\n"}
              To update them permanently, please go to Edit Profile.
            </Text>
            <TouchableOpacity style={styles.popupButton} onPress={() => setShowPopup(false)}>
              <Text style={styles.popupButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Interests</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(interestsData).map(([category, items]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.category}>{category}</Text>
            <View style={styles.grid}>
              {items.map((item) => {
                const isSelected = selected.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleSelect(item)}
                    style={[styles.chip, isSelected && styles.selectedChip]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.selectedText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  back: { color: "#ff5864", fontWeight: "600" },
  done: { color: "#ff5864", fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold" },
  section: { padding: 16 },
  category: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 16, color: "#111" },
  selectedChip: { backgroundColor: "#FACC15" },
  selectedText: { fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  popupBubble: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    maxWidth: "85%",
    alignItems: "center",
    elevation: 5,
  },
  popupText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  popupButton: {
    backgroundColor: "#ff5864",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  popupButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
