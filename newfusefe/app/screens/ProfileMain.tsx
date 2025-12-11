import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProgressBar } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { BottomNav } from "../../components/BottomNav";

const BASE_URL = "http://172.20.10.4:5000";
const TABS = ["About", "Photos", "Preferences"];

const ICON_MAP: Record<string, string> = {
  Pronouns: "user",
  Sexuality: "heart",
  Education: "book",
  Job: "briefcase",
  Location: "map-pin",
  Hometown: "home",
  Drinking: "wine",
  Smoking: "wind",
  Intentions: "target",
  Zodiac: "moon",
  Religion: "book-open",
};

const ProfilePage = ({ navigation }) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("About");
  const [showProfileReminder, setShowProfileReminder] = useState(false);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "Session expired. Please log in again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const response = await fetch(`${BASE_URL}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch user profile");
      const { data } = await response.json();
      setUserData(data);

      const sessionPopupKey = "popup_shown_this_session";
      const alreadyShown = await AsyncStorage.getItem(sessionPopupKey);
      if (data.profileComplete < 100 && !alreadyShown) {
        setShowProfileReminder(true);
        await AsyncStorage.setItem(sessionPopupKey, "true");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [navigation])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
  try {
    const keysToRemove = [
      "jwtToken",
      "userId",
      "username",
      "fullPhoneNumber",            // ensure number isn't prefilled
      "popup_shown_this_session",
      "temporaryInterests",         // if you store temp filters
      "hasPendingChats",            // clear pending badge state between accounts
    ];
    await AsyncStorage.multiRemove(keysToRemove);

    // Hard reset stack so back can't return to authenticated screens
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  } catch (e) {
    Alert.alert("Error", "Logout failed.");
  }
};

  const extraFields = [
    { label: "Pronouns", value: userData?.pronouns },
    { label: "Sexuality", value: userData?.sexuality },
    { label: "Education", value: userData?.educationLevel },
    { label: "Job", value: userData?.jobTitle },
    {
      label: "Location",
      value:
        userData?.location?.latitude && userData?.location?.longitude
          ? `Lat: ${userData.location.latitude}, Lng: ${userData.location.longitude}`
          : null,
    },
    { label: "Hometown", value: userData?.homeTown },
    { label: "Drinking", value: userData?.drinking },
    { label: "Smoking", value: userData?.smoking },
    { label: "Intentions", value: userData?.datingIntentions },
    { label: "Zodiac", value: userData?.zodiacSign },
    { label: "Religion", value: userData?.religion },
  ];

  const Chip = ({ icon, text }: { icon?: string; text: string }) => (
  <View style={styles.chip}>
    {!!icon && (
      <View style={styles.iconBubble}>
        <Icon name={icon} size={14} color="#111827" />
      </View>
    )}
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

  const RowItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.rowItem}>
      <View style={styles.iconBubbleRow}>
        <Icon name={ICON_MAP[label] || "tag"} size={16} color="#111827" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Photos":
        return userData.photos?.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile Photos</Text>
            <View style={styles.photoGrid}>
              {Array.from({ length: 6 }).map((_, i) => {
                const photo = userData.photos?.[i] ?? null;
                return photo ? (
                  <Image
                    key={i}
                    source={{ uri: photo }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View key={i} style={[styles.gridImage, styles.placeholderBox]}>
                    <Text style={styles.placeholderText}>+</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null;

      case "Preferences":
        return (
          <>
            {userData.interests?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.chipWrap}>
                  {userData.interests.map((it: string, idx: number) => (
                    <Chip key={idx} text={it} />
                  ))}
                </View>
              </View>
            )}

            {userData.values?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Values</Text>
                <View style={styles.chipWrap}>
                  {userData.values.map((val: string, idx: number) => (
                    <Chip key={idx} icon="star" text={val} />
                  ))}
                </View>
              </View>
            )}
          </>
        );

      case "About":
      default:
        return (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Basic Info</Text>

              <RowItem label="Phone" value={userData.phoneNumber} />
              <RowItem label="Date of Birth" value={userData.dateOfBirth} />
              <RowItem label="Gender" value={userData.gender} />
              <RowItem label="Height" value={userData.height} />
            </View>

            {extraFields.filter((f) => f.value).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>More Info</Text>
                {extraFields.map(
                  (f, i) => f.value && <RowItem key={i} label={f.label} value={String(f.value)} />
                )}
              </View>
            )}
          </>
        );
    }
  };

  if (loading || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal visible={showProfileReminder} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <TouchableOpacity
              style={styles.popupClose}
              onPress={() => setShowProfileReminder(false)}
            >
              <Icon name="x" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.popupText}>
              Your profile is incomplete. Add more info to get better matches!
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => {
                setShowProfileReminder(false);
                navigation.navigate("UpdateProfilePage", { userData });
              }}
            >
              <Text style={styles.popupButtonText}>Complete Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={{ paddingTop: 10 }}>
            <Icon name="settings" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardProfile}>
          {userData?.photos?.[0] ? (
            <Image
              source={{ uri: userData.photos[0] }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={{ uri: "https://via.placeholder.com/100" }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          )}
          <Text style={styles.userName}>{userData.name || "No name provided"}</Text>
          <ProgressBar progress={userData.profileComplete / 100} color="#10b981" style={styles.progressBar} />
          <Text style={styles.profilePercentageText}>
            {`${Math.round(userData.profileComplete)}% Complete`}
          </Text>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTabContent()}

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate("UpdateProfilePage", { userData })}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNavWrapper}>
        <BottomNav />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollViewContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    elevation: 2,
    paddingTop: 40,
  },
  title: { fontSize: 30, fontWeight: "bold", color: "#111827" },

  // Profile top card
  cardProfile: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
  },
  profileImage: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  userName: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  progressBar: { height: 6, borderRadius: 3, width: "80%", marginTop: 8 },
  profilePercentageText: { fontSize: 14, color: "#10b981", marginTop: 4 },

  // Generic card
  card: { margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginBottom: 12, color: "#374151" },

  // Chips (Interests / Values)
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 8,
    // subtle shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    // elevation for Android
    elevation: 1,
  },
  iconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  chipText: { color: "#111827", fontSize: 14, fontWeight: "500" },

  // Row items (About / More Info)
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iconBubbleRow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: { fontSize: 12, color: "#6b7280" },
  rowValue: { fontSize: 16, color: "#111827", marginTop: 2 },

  // Photo grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 12,
  },
  gridImage: {
    width: (Dimensions.get("window").width - 64) / 3,
    height: (Dimensions.get("window").width - 64) / 3,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#eee",
  },
  placeholderBox: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  placeholderText: { fontSize: 32, color: "#aaa" },

  // Tabs
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    elevation: 2,
  },
  tabItem: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 },
  tabItemActive: { backgroundColor: "#e0f2f1" },
  tabText: { fontSize: 16, color: "#4b5563" },
  tabTextActive: { color: "#0f766e", fontWeight: "bold" },

  // Buttons
  editProfileButton: {
    margin: 16,
    backgroundColor: "#e11d48",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  editProfileText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  logoutButton: {
    margin: 16,
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  bottomNavWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },

  // Popup
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 320,
    padding: 24,
    borderRadius: 16,
    elevation: 12,
    alignItems: "center",
    position: "relative",
  },
  popupText: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  popupButton: {
    backgroundColor: "#e11d48",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  popupButtonText: { color: "#fff", fontWeight: "bold" },
  popupClose: { position: "absolute", top: 8, right: 8, padding: 4 },
});

export default ProfilePage;
