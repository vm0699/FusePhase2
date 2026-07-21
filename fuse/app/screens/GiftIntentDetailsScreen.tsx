import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { giftApi } from "../api/giftApi";
import { FusePopup } from "../../components/FusePopup";
import GiftStatusBadge from "../../components/GiftStatusBadge";

/**
 * Payment-first MVP: there is no recipient accept/reject step. This screen is a
 * deep-link / notification fallback. If a paid order exists for the intent, it
 * routes the user to order tracking; otherwise it shows the intent summary.
 */
export default function GiftIntentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { intentId } = route.params || {};

  const [intent, setIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  const showPopup = useCallback(
    (
      title: string,
      message?: string,
      tone: "default" | "success" | "error" | "info" = "default"
    ) => setPopup({ visible: true, title, message, tone }),
    []
  );

  const load = useCallback(async () => {
    if (!intentId) {
      setLoading(false);
      return;
    }
    try {
      const data = await giftApi.getIntent(intentId);
      setIntent(data || null);
    } catch (error: any) {
      showPopup("Error", error?.message || "Failed to load gift.", "error");
    } finally {
      setLoading(false);
    }
  }, [intentId, showPopup]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = intent?.catalogSnapshot;
  const order = intent?.order;
  const latestPayment = intent?.latestPayment;
  // Once an order exists, tracking takes over — these banners are only for
  // the gap between "submitted" and an admin actually verifying it.
  const showPendingUpiBanner =
    !order && latestPayment?.mode === "UPI" && latestPayment?.status === "PENDING_VERIFICATION";
  const showFailedPaymentBanner = !order && latestPayment?.status === "FAILED";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gift</Text>
          <Text style={styles.headerSubtitle}>Gift details</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : intent ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.sectionTitle}>
                {snapshot?.name || intent.items?.[0]?.name || "Gift"}
              </Text>
              <GiftStatusBadge status={intent.status} />
            </View>
            {!!snapshot?.description && (
              <Text style={styles.desc}>{snapshot.description}</Text>
            )}
            <Text style={styles.label}>Counterpart</Text>
            <Text style={styles.value}>
              {intent.counterpart?.name || intent.counterpart?.username || "Fuse user"}
            </Text>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>₹{intent.totalAmount}</Text>
          </View>

          {showPendingUpiBanner && (
            <View style={styles.bannerCard}>
              <Text style={styles.bannerTitle}>Payment submitted</Text>
              <Text style={styles.bannerText}>
                We're verifying your payment. This usually takes a few hours — you'll be notified
                once it's confirmed.
              </Text>
            </View>
          )}

          {showFailedPaymentBanner && (
            <View style={[styles.bannerCard, styles.bannerCardError]}>
              <Text style={[styles.bannerTitle, styles.bannerTitleError]}>
                Couldn't verify payment
              </Text>
              <Text style={styles.bannerText}>
                We weren't able to confirm your payment. Please retry from the chat.
              </Text>
            </View>
          )}

          {order ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                navigation.navigate("GiftOrderTrackingScreen", {
                  orderId: order.orderId,
                  chatId: intent.chatId,
                })
              }
            >
              <Text style={styles.primaryText}>Track this gift</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("ChatListScreen")}
          >
            <Text style={styles.linkText}>Open chats</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Gift unavailable.</Text>
        </View>
      )}

      <FusePopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
  },
  headerButton: {
    minWidth: 70,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: { color: "#6B7280", fontFamily: "Poppins-SemiBold" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 24, color: "#1a1a1a", fontFamily: "Poppins-Bold" },
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", fontFamily: "Poppins" },
  headerSpacer: { width: 70 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: "#ffffff", borderRadius: 20, padding: 18, marginBottom: 14 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    flex: 1,
    marginRight: 10,
  },
  desc: { marginTop: 6, fontSize: 13, color: "#6B7280", fontFamily: "Poppins" },
  bannerCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  bannerCardError: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  bannerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: "#C2410C",
    marginBottom: 4,
  },
  bannerTitleError: { color: "#DC2626" },
  bannerText: { fontFamily: "Poppins", fontSize: 13, color: "#6B7280", lineHeight: 19 },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Poppins-SemiBold",
    marginTop: 12,
  },
  value: {
    marginTop: 4,
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  primaryButton: {
    backgroundColor: "#ff5864",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  primaryText: { color: "#ffffff", fontFamily: "Poppins-Bold" },
  linkButton: { alignItems: "center", paddingVertical: 10 },
  linkText: { color: "#6B7280", fontFamily: "Poppins-SemiBold" },
  emptyText: { color: "#6B7280", fontFamily: "Poppins" },
});
