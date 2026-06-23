import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  Settings,
  Eye,
  Gift,
  LogOut,
  ChevronRight,
  Edit2,
  X,
  Camera,
  Sparkles,
  User,
  Heart,
  BookOpen,
  Briefcase,
  MapPin,
  Home,
  Wine,
  Wind,
  Target,
  Moon,
  BookMarked,
  Phone,
  Calendar,
  Users,
  BarChart2,
} from "lucide-react-native";
import { BottomNav } from "../../components/BottomNav";
import { authClient } from "../auth/authClient";
import { pushManager } from "../notifications/pushManager";
import { API_BASE_URL } from "../config/env";
import { theme } from "../theme";
import ProfileMainSkeleton from "../../components/skeletons/ProfileMainSkeleton";

const BASE_URL = API_BASE_URL;
const { width } = Dimensions.get("window");
const HERO_HEIGHT = 340;
const PHOTO_GAP = 8;
const PHOTO_SIZE = (width - 64) / 3;

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Pronouns: User,
  Sexuality: Heart,
  Education: BookOpen,
  Job: Briefcase,
  Location: MapPin,
  Hometown: Home,
  Drinking: Wine,
  Smoking: Wind,
  Intentions: Target,
  Zodiac: Moon,
  Religion: BookMarked,
  Phone: Phone,
  "Date of Birth": Calendar,
  Gender: Users,
  Height: BarChart2,
};

// ─── Component ───────────────────────────────────────────────────────────────

const ProfilePage = ({ navigation }) => {
  // ── State (all original state preserved) ─────────────────────────────────
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  // preview navigates to ProfilePreviewScreen (no local modal state needed)

  // ── Fetch (exact same as original) ────────────────────────────────────────
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

  // ── Logout (exact same as original) ───────────────────────────────────────
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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading || !userData) {
    return (
      <View style={styles.container}>
        <ProfileMainSkeleton />
        <View style={styles.bottomNavWrapper}>
          <BottomNav />
        </View>
      </View>
    );
  }

  // ── Derived display data ───────────────────────────────────────────────────
  const completeness = Math.round(userData.profileComplete || 0);
  const heroPhoto = userData?.photos?.[0] || null;
  const allPhotos: (string | null)[] = Array.from(
    { length: 6 },
    (_, i) => userData?.photos?.[i] ?? null
  );

  const vitals: { label: string; value: string }[] = [
    userData?.gender && { label: "Gender", value: userData.gender },
    userData?.datingIntentions && { label: "Intentions", value: userData.datingIntentions },
    userData?.pronouns && { label: "Pronouns", value: userData.pronouns },
    userData?.zodiacSign && { label: "Zodiac", value: userData.zodiacSign },
    userData?.sexuality && { label: "Sexuality", value: userData.sexuality },
  ].filter(Boolean) as { label: string; value: string }[];

  const extraFields = [
    { label: "Pronouns", value: userData?.pronouns },
    { label: "Sexuality", value: userData?.sexuality },
    { label: "Education", value: userData?.educationLevel },
    { label: "Job", value: userData?.jobTitle },
    { label: "Hometown", value: userData?.homeTown },
    { label: "Drinking", value: userData?.drinking },
    { label: "Smoking", value: userData?.smoking },
    { label: "Intentions", value: userData?.datingIntentions },
    { label: "Zodiac", value: userData?.zodiacSign },
    { label: "Religion", value: userData?.religion },
  ].filter((f) => f.value);

  // ── Sub-components ─────────────────────────────────────────────────────────

  const SectionLabel = ({ text }: { text: string }) => (
    <Text style={styles.sectionLabel}>{text.toUpperCase()}</Text>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => {
    const IconComp = ICON_MAP[label];
    return (
      <View style={styles.infoRow}>
        <View style={styles.infoIconBubble}>
          {IconComp ? (
            <IconComp size={14} color={theme.colors.textSecondary} />
          ) : (
            <BarChart2 size={14} color={theme.colors.textSecondary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoRowLabel}>{label}</Text>
          <Text style={styles.infoRowValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const Chip = ({ text, accent }: { text: string; accent?: boolean }) => (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Text style={[styles.chipText, accent && styles.chipTextAccent]}>{text}</Text>
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ─── Profile Incomplete Reminder Modal (original logic preserved) ─── */}
      <Modal visible={showProfileReminder} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowProfileReminder(false)}
            >
              <X size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.modalIconWrap}>
              <Sparkles size={28} color={theme.colors.brand} />
            </View>
            <Text style={styles.modalTitle}>Profile Incomplete</Text>
            <Text style={styles.modalText}>
              Add more info to get better matches!
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowProfileReminder(false);
                navigation.navigate("UpdateProfilePage", { userData });
              }}
            >
              <Text style={styles.modalBtnText}>Complete Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Main scrollable content ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header row */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.topBarBtn}
          >
            <Settings size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Hero photo ── */}
        <View style={styles.heroWrap}>
          {heroPhoto ? (
            <Image
              source={{ uri: heroPhoto }}
              style={styles.heroPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroPhoto, styles.heroPhotoEmpty]}>
              <Camera size={48} color={theme.colors.textTertiary} />
              <Text style={styles.heroPhotoEmptyText}>Add a photo</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.68)"]}
            style={styles.heroGradient}
          >
            <Text style={styles.heroName}>
              {userData.name || "Your name"}
              {userData?.dateOfBirth ? `, ${calcAge(userData.dateOfBirth)}` : ""}
            </Text>
          </LinearGradient>
        </View>

        {/* ── Profile completeness ── */}
        <View style={styles.completenessWrap}>
          <View style={styles.completenessRow}>
            <Text style={styles.completenessLabel}>Profile strength</Text>
            <Text style={styles.completenessPercent}>{completeness}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completeness}%` }]} />
          </View>
          {completeness < 100 && (
            <Text style={styles.completenessHint}>
              Complete your profile to get better matches
            </Text>
          )}
        </View>

        {/* ── "See how you appear" card ── */}
        <TouchableOpacity
          style={styles.previewBanner}
          onPress={() => navigation.navigate("ProfilePreview" as never, { userData } as never)}
          activeOpacity={0.75}
        >
          <View style={styles.previewBannerIcon}>
            <Eye size={18} color={theme.colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewBannerTitle}>Preview your profile</Text>
            <Text style={styles.previewBannerSub}>See how you appear in discovery</Text>
          </View>
          <ChevronRight size={16} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* ── Vitals chips ── */}
        {vitals.length > 0 && (
          <View style={styles.card}>
            <SectionLabel text="About me" />
            <View style={styles.chipRow}>
              {vitals.map((v, i) => (
                <Chip key={i} text={v.value} />
              ))}
            </View>
          </View>
        )}

        {/* ── Interests ── */}
        {userData?.interests?.length > 0 && (
          <View style={styles.card}>
            <SectionLabel text="Interests" />
            <View style={styles.chipRow}>
              {userData.interests.map((it: string, i: number) => (
                <Chip key={i} text={it} accent />
              ))}
            </View>
          </View>
        )}

        {/* ── Values ── */}
        {userData?.values?.length > 0 && (
          <View style={styles.card}>
            <SectionLabel text="Values" />
            <View style={styles.chipRow}>
              {userData.values.map((val: string, i: number) => (
                <Chip key={i} text={val} />
              ))}
            </View>
          </View>
        )}

        {/* ── More about me ── */}
        {extraFields.length > 0 && (
          <View style={styles.card}>
            <SectionLabel text="More about me" />
            {extraFields.map((f, i) => (
              <InfoRow key={i} label={f.label} value={String(f.value)} />
            ))}
          </View>
        )}

        {/* ── Basic info ── */}
        <View style={styles.card}>
          <SectionLabel text="Basic info" />
          {userData?.phoneNumber && (
            <InfoRow label="Phone" value={userData.phoneNumber} />
          )}
          {userData?.dateOfBirth && (
            <InfoRow label="Date of Birth" value={userData.dateOfBirth} />
          )}
          {userData?.gender && (
            <InfoRow label="Gender" value={userData.gender} />
          )}
          {userData?.height && (
            <InfoRow label="Height" value={userData.height} />
          )}
        </View>

        {/* ── Photo grid ── */}
        {allPhotos.some(Boolean) && (
          <View style={styles.card}>
            <SectionLabel text="Photos" />
            <View style={styles.photoGrid}>
              {allPhotos.map((photo, i) =>
                photo ? (
                  <Image
                    key={i}
                    source={{ uri: photo }}
                    style={styles.gridPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View key={i} style={[styles.gridPhoto, styles.gridPhotoEmpty]} />
                )
              )}
            </View>
          </View>
        )}

        {/* ── Edit Profile CTA ── */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("UpdateProfilePage", { userData })}
          activeOpacity={0.82}
        >
          <Edit2 size={16} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* ── My Gifts ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate("MyGiftsScreen")}
          style={styles.rowBtn}
          activeOpacity={0.75}
        >
          <View style={styles.rowBtnIcon}>
            <Gift size={16} color={theme.colors.brand} />
          </View>
          <Text style={styles.rowBtnText}>My gifts</Text>
          <ChevronRight size={16} color={theme.colors.textTertiary} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        {/* ── Logout ── */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.rowBtn, styles.rowBtnLogout]}
          activeOpacity={0.75}
        >
          <View style={styles.rowBtnIcon}>
            <LogOut size={15} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.rowBtnTextLogout}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNavWrapper}>
        <BottomNav />
      </View>
    </View>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  // ── Header ──────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 12,
  },
  topBarTitle: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.2,
  },
  topBarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Hero photo ──────────────────────────────────────────────────────────────
  heroWrap: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  heroPhoto: {
    width: "100%",
    height: HERO_HEIGHT,
    backgroundColor: theme.colors.surfaceSunken,
  },
  heroPhotoEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroPhotoEmptyText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  heroName: {
    fontSize: 24,
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },

  // ── Completeness ────────────────────────────────────────────────────────────
  completenessWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  completenessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  completenessLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: "Poppins-SemiBold",
  },
  completenessPercent: {
    fontSize: 13,
    color: theme.colors.brand,
    fontFamily: "Poppins-Bold",
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.brand,
    borderRadius: 999,
  },
  completenessHint: {
    marginTop: 6,
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
  },

  // ── Preview banner ───────────────────────────────────────────────────────────
  previewBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: theme.colors.brandSofter,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  previewBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBannerTitle: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-SemiBold",
  },
  previewBannerSub: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
    marginTop: 1,
  },

  // ── Cards ────────────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },

  // ── Section labels ───────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 0.9,
  },

  // ── Chips ────────────────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipAccent: {
    backgroundColor: theme.colors.brandSofter,
    borderColor: theme.colors.brandBorder,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
  },
  chipTextAccent: {
    color: theme.colors.brand,
  },

  // ── Info rows ────────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  infoIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRowLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRowValue: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-SemiBold",
    marginTop: 1,
  },

  // ── Photo grid ───────────────────────────────────────────────────────────────
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  gridPhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSunken,
  },
  gridPhotoEmpty: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 110,
  },

  // ── Edit CTA ─────────────────────────────────────────────────────────────────
  editBtn: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: theme.colors.brand,
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: theme.colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  editBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },

  // ── Row buttons (gifts, logout) ───────────────────────────────────────────────
  rowBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowBtnLogout: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  rowBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBtnText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-SemiBold",
  },
  rowBtnTextLogout: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: "Poppins-SemiBold",
  },

  // ── Bottom nav ───────────────────────────────────────────────────────────────
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Profile Reminder Modal ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    width: "100%",
    maxWidth: 320,
    padding: 28,
    borderRadius: 24,
    elevation: 12,
    alignItems: "center",
    position: "relative",
  },
  modalClose: { position: "absolute", top: 14, right: 14, padding: 4 },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brandSofter,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 22,
    textAlign: "center",
    fontFamily: "Poppins",
    lineHeight: 20,
  },
  modalBtn: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },

});

export default ProfilePage;
