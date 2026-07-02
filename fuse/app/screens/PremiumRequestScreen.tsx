import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Crown, Sparkles } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi from "../api/exploreApi";

const OCCASION_OPTIONS = [
  "Romantic Surprise",
  "Birthday Celebration",
  "Anniversary",
  "First Date Plan",
  "Proposal Planning",
  "Custom Dinner Experience",
  "Other",
];

export default function PremiumRequestScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    occasion.length > 0 &&
    Number(budget) >= 3000;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await exploreApi.submitPremiumRequest({
        occasion,
        budget: Number(budget),
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        "Request Received!",
        res.message ||
          "Our team will reach out to you soon via WhatsApp or phone to plan your experience.",
        [{ text: "Great!", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>Premium Experience</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Concierge intro ─────────────────────────────────────────────── */}
          <View style={styles.introBanner}>
            <Crown size={28} color="#F59E0B" strokeWidth={1.8} />
            <View style={styles.introText}>
              <Text style={styles.introTitle}>Your personal concierge</Text>
              <Text style={styles.introSub}>
                Tell us what you're dreaming of. We'll plan, coordinate, and make it happen — seamlessly.
              </Text>
            </View>
            <Sparkles size={20} color="#F59E0B" strokeWidth={1.8} />
          </View>

          {/* ─── Occasion picker ─────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>What's the occasion?</Text>
            <View style={styles.optionGrid}>
              {OCCASION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setOccasion(opt)}
                  style={[
                    styles.optionChip,
                    occasion === opt && styles.optionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      occasion === opt && styles.optionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ─── Budget ──────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>Your budget (₹)</Text>
            <Text style={styles.hint}>Minimum ₹3,000 · We'll try our best within your budget</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="3000"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
                returnKeyType="next"
              />
            </View>
            {budget.length > 0 && Number(budget) < 3000 && (
              <Text style={styles.errorText}>Minimum budget is ₹3,000</Text>
            )}
          </View>

          {/* ─── Notes ───────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.label}>Tell us more (optional)</Text>
            <Text style={styles.hint}>
              Dietary needs, preferred time, any vibe — the more detail, the better we can plan
            </Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g. rooftop dinner, loves Italian food, allergic to nuts, anniversary on July 14th…"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* ─── How it works ────────────────────────────────────────────────── */}
          <View style={styles.howCard}>
            <Text style={styles.howTitle}>How it works</Text>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>1</Text>
              <Text style={styles.howText}>Submit your request & budget</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>2</Text>
              <Text style={styles.howText}>Our team contacts you within 24h</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>3</Text>
              <Text style={styles.howText}>We plan everything — you review & pay</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>4</Text>
              <Text style={styles.howText}>Sit back and enjoy your experience ✨</Text>
            </View>
          </View>

          {/* ─── CTA ─────────────────────────────────────────────────────────── */}
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || loading}
            style={({ pressed }) => [
              styles.cta,
              (!isValid || loading) && styles.ctaDisabled,
              pressed && isValid && !loading && { opacity: 0.88 },
            ]}
          >
            <Text style={styles.ctaText}>
              {loading ? "Sending..." : "Request My Experience"}
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            No payment required yet. Our team will reach out before anything is charged.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scroll: {
    padding: 20,
    gap: 24,
  },
  introBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FEF9EC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  introText: {
    flex: 1,
    gap: 4,
  },
  introTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: "#92400E",
  },
  introSub: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: "#B45309",
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  label: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  hint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textTertiary,
    lineHeight: 17,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionChipActive: {
    backgroundColor: theme.colors.brandSoft,
    borderColor: theme.colors.brandBorder,
  },
  optionText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.brand,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  inputPrefix: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 17,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  errorText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.errorFg,
  },
  textarea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    minHeight: 110,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  howCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  howTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  howStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  howNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.brandSoft,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.colors.brand,
    overflow: "hidden",
  },
  howText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: theme.colors.brand,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    backgroundColor: theme.colors.border,
  },
  ctaText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.2,
  },
  footer: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: "center",
    lineHeight: 17,
  },
});
