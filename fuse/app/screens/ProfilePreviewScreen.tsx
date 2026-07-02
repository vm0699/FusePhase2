/**
 * ProfilePreviewScreen
 *
 * Shows the current user's profile exactly as other users see it in SwipeView —
 * photo pager with name/age overlay, followed by the real ProfileInfoCard.
 * Navigated to from ProfileMain with { userData } param.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Camera } from "lucide-react-native";
import { ProfileInfoCard } from "../../components/ProfileInfoCard";
import { theme } from "../theme";

const { width } = Dimensions.get("window");
const PHOTO_HEIGHT = Math.round(width * 1.22); // ~4:3.3 card ratio — same as swipe cards

// ─── Age helper (mirrors the one used in SwipeView/ProfileInfoCard) ───────────

function calcAge(dob: string): number | null {
  if (!dob) return null;
  try {
    let birth: Date;
    if (/^\d{4}-\d{2}-\d{2}/.test(dob)) {
      birth = new Date(dob);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
      const [d, m, y] = dob.split("/");
      birth = new Date(`${y}-${m}-${d}`);
    } else {
      birth = new Date(dob);
    }
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 16 && age < 100 ? age : null;
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePreviewScreen({ navigation, route }) {
  const userData = route?.params?.userData ?? {};
  const insets = useSafeAreaInsets();

  const photos: string[] = (userData?.photos ?? []).filter(
    (p: any): p is string => typeof p === "string" && p.length > 0
  );

  const [photoIndex, setPhotoIndex] = useState(0);

  const age = calcAge(userData?.dateOfBirth ?? "");
  const displayName = [userData?.name, age].filter(Boolean).join(", ");

  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setPhotoIndex(Math.max(0, Math.min(idx, photos.length - 1)));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Your profile</Text>
          <Text style={styles.topBarSub}>As others see you in discovery</Text>
        </View>
        {/* balance spacer — invisible, just reserves width so the title stays centered */}
        <View style={styles.spacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Photo pager ── */}
        <View style={styles.photoCard}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onPhotoScroll}
                scrollEventThrottle={16}
              >
                {photos.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Pager progress dots — same as SwipeView */}
              {photos.length > 1 && (
                <View style={styles.dotsRow}>
                  {photos.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === photoIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            /* No photo placeholder */
            <View style={[styles.photo, styles.photoEmpty]}>
              <Camera size={48} color={theme.colors.textTertiary} />
              <Text style={styles.photoEmptyText}>No photo added yet</Text>
            </View>
          )}

          {/* Name / age gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)"]}
            style={styles.gradient}
            pointerEvents="none"
          >
            <Text style={styles.overlayName}>{displayName || "Your Name"}</Text>
            {userData?.datingIntentions ? (
              <Text style={styles.overlayIntention}>{userData.datingIntentions}</Text>
            ) : null}
          </LinearGradient>
        </View>

        {/* ── Profile info card (same component used in SwipeView) ── */}
        <View style={styles.infoCardWrap}>
          <ProfileInfoCard
            dateOfBirth={userData?.dateOfBirth}
            gender={userData?.gender}
            pronouns={userData?.pronouns}
            sexuality={userData?.sexuality}
            height={userData?.height}
            work={userData?.work}
            jobTitle={userData?.jobTitle}
            college={userData?.college}
            educationLevel={userData?.educationLevel}
            lives_in={userData?.location?.city ?? userData?.lives_in}
            homeTown={userData?.homeTown}
            religion={userData?.religion}
            zodiacSign={userData?.zodiacSign}
            politics={userData?.politics}
            ethnicity={userData?.ethnicity}
            drinking={userData?.drinking}
            smoking={userData?.smoking}
            marijuana={userData?.marijuana}
            drugs={userData?.drugs}
            datingIntentions={userData?.datingIntentions}
            relationshipType={userData?.relationshipType}
            children={userData?.children}
            familyPlans={userData?.familyPlans}
            pets={userData?.pets}
            languages={userData?.languages}
            interests={userData?.interests}
          />
        </View>

        {/* ── Prompts (if any) ── */}
        {userData?.prompts?.filter((p: any) => p?.answer)?.length > 0 && (
          <View style={styles.promptsWrap}>
            <Text style={styles.promptsLabel}>Prompts</Text>
            {userData.prompts
              .filter((p: any) => p?.answer)
              .map((prompt: any, i: number) => (
                <View key={i} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{prompt.question}</Text>
                  <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                </View>
              ))}
          </View>
        )}

        {/* ── Footer note ── */}
        <View style={styles.footer}>
          <View style={styles.footerBar} />
          <Text style={styles.footerText}>
            This is how your profile appears to other users in discovery.
          </Text>
          <TouchableOpacity
            style={styles.editCta}
            onPress={() => {
              navigation.goBack();
              // Give ProfileMain time to be visible before navigating further
              setTimeout(() => {
                navigation.navigate("UpdateProfilePage" as never, {
                  userData,
                } as never);
              }, 350);
            }}
          >
            <Text style={styles.editCtaText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  // ── Top bar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === "ios" ? 0 : 8,
  },
  backBtn: {
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
  spacer: {
    width: 38,
    height: 38,
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
  },
  topBarTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-Bold",
  },
  topBarSub: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
    marginTop: 1,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 48,
  },

  // ── Photo pager ─────────────────────────────────────────────────────────────
  photoCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  photo: {
    width: width - 32, // matches marginHorizontal: 16 on both sides
    height: PHOTO_HEIGHT,
    backgroundColor: theme.colors.surfaceSunken,
  },
  photoEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
  },
  photoEmptyText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
  },

  // Dots
  dotsRow: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    zIndex: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
    borderRadius: 3,
  },

  // Gradient overlay
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 4,
  },
  overlayName: {
    fontSize: 26,
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  overlayIntention: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Poppins",
  },

  // ── Profile info card ────────────────────────────────────────────────────────
  infoCardWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
  },

  // ── Prompts ──────────────────────────────────────────────────────────────────
  promptsWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  promptsLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  promptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  promptQuestion: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins-SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  promptAnswer: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-SemiBold",
    lineHeight: 24,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 24,
    gap: 10,
  },
  footerBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
    textAlign: "center",
    lineHeight: 20,
  },
  editCta: {
    backgroundColor: theme.colors.brand,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: theme.colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  editCtaText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
});
