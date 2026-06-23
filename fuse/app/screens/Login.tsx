/**
 * Login — dark editorial screen, Hinge-inspired.
 *
 * Background: deep warm dark + floating coral gradient orbs.
 * To add a video background later:
 *   1. npx expo install expo-av
 *   2. Drop your file at assets/bg-video.mp4
 *   3. Uncomment the <Video> block below and remove <View style={styles.bgOrbs}>
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";
import { FusePopup } from "../../components/FusePopup";

// ─── Colors ───────────────────────────────────────────────────────────────────
// Not using theme tokens here — this screen is intentionally dark and
// standalone; it should not inherit the app's light palette.
const BG = "#0c0608";
const BRAND = "#ff5864";
const BRAND_DARK = "#e03e4a";
const WHITE = "#ffffff";
const WHITE70 = "rgba(255,255,255,0.70)";
const WHITE40 = "rgba(255,255,255,0.40)";
const WHITE12 = "rgba(255,255,255,0.12)";

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginPage({ navigation }) {
  const insets = useSafeAreaInsets();

  const [popupState, setPopupState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  // All navigation logic preserved — both CTAs go to PhoneVerif;
  // the backend determines new vs returning user by phone number.
  const handleNavigation = () => {
    navigation.navigate("PhoneVerif");
  };

  const showPopup = (
    title: string,
    message?: string,
    tone: "default" | "success" | "error" | "info" = "default"
  ) => {
    setPopupState({ visible: true, title, message, tone });
  };

  return (
    <View style={styles.container}>

      {/* ── Background: warm dark with floating coral orbs ── */}
      {/* To replace with video: swap this View for an expo-av <Video> component */}
      <View style={StyleSheet.absoluteFill}>
        {/* Base dark fill */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
        {/* Top-right warm orb */}
        <LinearGradient
          colors={["rgba(255,88,100,0.28)", "transparent"]}
          style={styles.orbTopRight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Bottom-left warm orb */}
        <LinearGradient
          colors={["rgba(255,88,100,0.18)", "transparent"]}
          style={styles.orbBottomLeft}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Center depth haze */}
        <LinearGradient
          colors={["transparent", "rgba(20,4,8,0.6)", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* ── Content ── */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "ios" ? 20 : 28),
            paddingBottom: insets.bottom + 28,
          },
        ]}
      >
        {/* Wordmark */}
        <Text style={styles.wordmark}>Fuse</Text>

        {/* Hero headline — left-aligned, editorial */}
        <View style={styles.hero}>
          <Text style={styles.headlineTop}>Start</Text>
          <Text style={styles.headlineBottom}>something real.</Text>
          <Text style={styles.subhead}>
            Meet people worth meeting.
          </Text>
        </View>

        {/* Bottom CTA block */}
        <View style={styles.footer}>
          {/* Primary — Get started */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleNavigation}
            activeOpacity={0.86}
          >
            <Text style={styles.btnPrimaryText}>Get started</Text>
            <ArrowRight size={18} color={WHITE} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Secondary — Log in */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={handleNavigation}
            activeOpacity={0.75}
          >
            <Text style={styles.btnSecondaryText}>Log in</Text>
          </TouchableOpacity>

          {/* Terms */}
          <View style={styles.termsWrap}>
            <Text style={styles.termsText}>
              By continuing you agree to our{" "}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  showPopup("Terms", "Terms content has not been wired yet.", "info")
                }
              >
                Terms
              </Text>
              {" "}and{" "}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  showPopup(
                    "Privacy Policy",
                    "Privacy policy content has not been wired yet.",
                    "info"
                  )
                }
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </View>
      </View>

      <FusePopup
        visible={popupState.visible}
        title={popupState.title}
        message={popupState.message}
        tone={popupState.tone}
        onClose={() => setPopupState((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Background orbs ──────────────────────────────────────────────────────────
  orbTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  orbBottomLeft: {
    position: "absolute",
    bottom: -60,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
  },

  // ── Layout ───────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },

  // ── Wordmark ─────────────────────────────────────────────────────────────────
  wordmark: {
    fontSize: 26,
    color: WHITE,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  headlineTop: {
    fontSize: 62,
    color: WHITE,
    fontFamily: "Poppins-Bold",
    lineHeight: 68,
    letterSpacing: -1,
  },
  headlineBottom: {
    fontSize: 62,
    color: BRAND,
    fontFamily: "Poppins-Bold",
    lineHeight: 68,
    letterSpacing: -1,
    marginBottom: 20,
  },
  subhead: {
    fontSize: 16,
    color: WHITE70,
    fontFamily: "Poppins",
    lineHeight: 24,
  },

  // ── Footer / CTAs ─────────────────────────────────────────────────────────────
  footer: {
    gap: 12,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: BRAND,
    paddingVertical: 17,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: BRAND,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  btnPrimaryText: {
    color: WHITE,
    fontSize: 17,
    fontFamily: "Poppins-Bold",
  },
  btnSecondary: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: WHITE12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  btnSecondaryText: {
    color: WHITE,
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
  },

  // ── Terms ────────────────────────────────────────────────────────────────────
  termsWrap: {
    alignItems: "center",
    paddingTop: 4,
  },
  termsText: {
    color: WHITE40,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: "Poppins",
  },
  termsLink: {
    color: WHITE70,
    textDecorationLine: "underline",
    fontFamily: "Poppins-SemiBold",
  },
});
