import React from "react";
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomNav } from "../../components/BottomNav";

// ✅ Import real images
const featureImages = {
  smartMatching: require("../../assets/smartmatch.jpg"), // Replace with your actual image
  videoFirst: require("../../assets/videocall.jpg"),
  safeSecure: require("../../assets/safesecure.jpg"),
};

const features = [
  {
    title: "Smart Matching",
    description:
      "Our AI-powered algorithm finds compatible matches based on your interests, values, and preferences.",
    image: featureImages.smartMatching, // ✅ Replaced placeholder with actual image
  },
  {
    title: "Video First",
    description:
      "Get to know potential matches through video calls before meeting in person.",
    image: featureImages.videoFirst, // ✅ Replaced placeholder with actual image
  },
  {
    title: "Safe & Secure",
    description:
      "Verified profiles and strict community guidelines ensure a respectful environment.",
    image: featureImages.safeSecure, // ✅ Replaced placeholder with actual image
  },
];

export default function HomePage() {
  const navigation = useNavigation();

  const handleVideoCallNavigation = () => {
    navigation.navigate("VideoInitiateScreen");
  };

  const handleChatNavigation = () => {
    navigation.navigate("ChatListScreen");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Find Your Perfect Match</Text>
          <Text style={styles.heroText}>
            Join millions of people finding meaningful connections through shared values and interests.
          </Text>
          {/* ✅ Start Swiping Button Updated */}
          <TouchableOpacity 
            style={styles.swipeButton}
            onPress={() => navigation.navigate("SwipeView")}
          >
            <Text style={styles.swipeButtonText}>Start Swiping</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Fuse?</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.card}>
              {/* Feature Image */}
              <Image source={feature.image} style={styles.featureImage} resizeMode="cover" />
              {/* Text Content */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav 
        onVideoCallPress={handleVideoCallNavigation} 
        onChatPress={handleChatNavigation} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingBottom: 80, // Prevents BottomNav overlap
  },
  hero: {
    backgroundColor: "#d92345", // ✅ Adjusted red shade (less bright)
    padding: 25,
    borderBottomLeftRadius: 10, // ✅ More rounded edges at bottom
    borderBottomRightRadius: 10, // ✅ More rounded edges at bottom
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
  },
  heroText: {
    fontSize: 16,
    color: "#f9f9f9",
    textAlign: "center",
    marginBottom: 20,
  },
  swipeButton: {
    backgroundColor: "white", // ✅ Changed to white
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10, // ✅ Rounded button
  },
  swipeButtonText: {
    color: "#d92345", // ✅ Text now matches the theme
    fontSize: 18,
    fontWeight: "bold",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
  featureImage: {
    width: "100%",
    height: 200, // Adjust height as needed
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#555",
  },
});
