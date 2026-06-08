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
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { BottomNav } from "../../components/BottomNav";
import { ElevatedProfileCard } from "../../components/ElevatedProfileCard";
import { SegmentedControl } from "../../components/SegmentedControl";
import { authClient } from "../auth/authClient";
import { pushManager } from "../notifications/pushManager";
import { API_BASE_URL } from "../config/env";

const BASE_URL = API_BASE_URL;
const TABS = [
  { id: "About", label: "About" },
  { id: "Photos", label: "Photos" },
  { id: "Preferences", label: "Preferences" },
];

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
  Phone: "phone",
  "Date of Birth": "calendar",
  Gender: "users",
  Height: "bar-chart-2",
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
      const uid = await AsyncStorage.getItem("userId");
      await pushManager.unregisterCurrentDevice();
      await authClient.logoutLocal();

      const keysToRemove = [
        "userId",
        "username",
        "fullPhoneNumber",
        "popup_shown_this_session",
        "temporaryInterests",
        "hasPendingChats",
      ];

      if (uid) {
        keysToRemove.push(`filters:${uid}`);
      }

      await AsyncStorage.multiRemove(keysToRemove);

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
        <Icon name={icon} size={12} color="#ff5864" style={{ marginRight: 5 }} />
      )}
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );

  const RowItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.rowItem}>
      <View style={styles.iconBubbleRow}>
        <Icon name={ICON_MAP[label] || "tag"} size={14} color="#1a1a1a" />
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
            <Text style={styles.sectionTitle}>Photos</Text>
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
                    <Icon name="plus" size={20} color="#C9C9C9" />
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
                <Text style={styles.sectionTitle}>More About Me</Text>
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
        <ActivityIndicator size="large" color="#ff5864" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  const completeness = Math.round(userData.profileComplete);

  return (
    <View style={styles.container}>
      {/* Incomplete Profile Modal */}
      <Modal visible={showProfileReminder} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <TouchableOpacity
              style={styles.popupClose}
              onPress={() => setShowProfileReminder(false)}
            >
              <Icon name="x" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <View style={styles.popupIconWrap}>
              <Icon name="alert-circle" size={28} color="#ff5864" />
            </View>
            <Text style={styles.popupTitle}>Profile Incomplete</Text>
            <Text style={styles.popupText}>
              Add more info to get better matches!
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.settingsBtn}
          >
            <Icon name="settings" size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Profile Hero Card */}
        <View style={styles.heroCardWrap}>
          <ElevatedProfileCard
            name={userData.name || "No name"}
            avatarUrl={userData?.photos?.[0] || "https://via.placeholder.com/100"}
            completeness={completeness}
          />
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBarWrap}>
          <SegmentedControl
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate("UpdateProfilePage", { userData })}
        >
          <Icon name="edit-2" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* My Gifts */}
        <TouchableOpacity
          onPress={() => navigation.navigate("MyGiftsScreen")}
          style={styles.myGiftsButton}
        >
          <Icon name="gift" size={16} color="#ff5864" style={{ marginRight: 8 }} />
          <Text style={styles.myGiftsText}>My gifts</Text>
          <Icon
            name="chevron-right"
            size={18}
            color="#9CA3AF"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out" size={15} color="#6B7280" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNavWrapper}>
        <BottomNav />
      </View>
    </View>
  );
};

const { width } = Dimensions.get("window");
const PHOTO_GAP = 8;
const PHOTO_SIZE = (width - 84) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  scrollViewContent: { paddingBottom: 110 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F3",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 12,
    backgroundColor: "#FAF8F3",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.2,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Hero Card ────────────────────────────────────────────
  heroCardWrap: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
  },

  // ── Tab Bar ──────────────────────────────────────────────
  tabBarWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // ── Card (generic) ───────────────────────────────────────
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    fontFamily: "Poppins",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  // ── Chips ────────────────────────────────────────────────
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 4,
    marginBottom: 6,
  },
  chipText: {
    color: "#1a1a1a",
    fontSize: 13,
    fontFamily: "Poppins",
    fontWeight: "500",
  },

  // ── Row Items ────────────────────────────────────────────
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  iconBubbleRow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  rowLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins",
    fontWeight: "500",
    marginTop: 1,
  },

  // ── Photo Grid ───────────────────────────────────────────
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridImage: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: PHOTO_GAP,
  },
  placeholderBox: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },

  // ── Buttons ──────────────────────────────────────────────
  editProfileButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: "#ff5864",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  editProfileText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  myGiftsButton: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  myGiftsText: {
    color: "#1a1a1a",
    fontWeight: "600",
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  logoutText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Poppins",
  },

  bottomNavWrapper: { position: "absolute", bottom: 0, left: 0, right: 0 },

  // ── Popup Modal ──────────────────────────────────────────
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  popupCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 320,
    padding: 28,
    borderRadius: 22,
    elevation: 12,
    alignItems: "center",
    position: "relative",
  },
  popupIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 6,
  },
  popupText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 22,
    textAlign: "center",
    fontFamily: "Poppins",
    lineHeight: 20,
  },
  popupButton: {
    backgroundColor: "#ff5864",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  popupButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  popupClose: { position: "absolute", top: 14, right: 14, padding: 4 },
});

export default ProfilePage;
