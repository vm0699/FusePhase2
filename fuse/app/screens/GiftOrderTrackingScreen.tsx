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
import { giftApi, GiftOrderView } from "../api/giftApi";
import { FusePopup } from "../../components/FusePopup";
import GiftStatusBadge from "../../components/GiftStatusBadge";
import GiftStatusTimeline from "../../components/GiftStatusTimeline";

const TERMINAL_BANNERS: Record<string, { title: string; tone: string }> = {
  CANCELLED: { title: "This gift was cancelled.", tone: "muted" },
  REFUND_REQUIRED: { title: "Refund required — our team will process it.", tone: "warn" },
  REFUNDED: { title: "This gift was refunded.", tone: "warn" },
};

export default function GiftOrderTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState<GiftOrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [declining, setDeclining] = useState(false);
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

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const data = await giftApi.getOrder(orderId);
      setOrder(data);
    } catch (error: any) {
      showPopup("Error", error?.message || "Failed to load gift order.", "error");
    } finally {
      setLoading(false);
    }
  }, [orderId, showPopup]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleDecline = async () => {
    if (declining || !order) return;
    setDeclining(true);
    try {
      await giftApi.declineOrder(order.orderId);
      await loadOrder();
      showPopup("Gift declined", "The gift has been declined.", "success");
    } catch (error: any) {
      showPopup("Error", error?.message || "Could not decline the gift.", "error");
    } finally {
      setDeclining(false);
    }
  };

  const banner = order ? TERMINAL_BANNERS[order.status] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gift tracking</Text>
          <Text style={styles.headerSubtitle}>Follow the order status</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : order ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  {order.perspective === "SENDER" ? "Gift to" : "Gift from"}
                </Text>
                <Text style={styles.value}>
                  {order.counterpart?.name || order.counterpart?.username || "Fuse user"}
                </Text>
              </View>
              <GiftStatusBadge status={order.status} label={order.statusLabel} />
            </View>

            {!!order.orderCode && (
              <>
                <Text style={styles.label}>Order code</Text>
                <Text style={styles.value}>{order.orderCode}</Text>
              </>
            )}

            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>
              {order.currency || "INR"} {order.totalAmount}
            </Text>
          </View>

          {banner && (
            <View
              style={[
                styles.bannerCard,
                banner.tone === "warn" ? styles.bannerWarn : styles.bannerMuted,
              ]}
            >
              <Text style={styles.bannerText}>{banner.title}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <GiftStatusTimeline status={order.status} />
            {!!order.tracking?.trackingUrl && (
              <Text style={styles.trackingValue}>
                Tracking: {order.tracking.trackingUrl}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items?.map((item, index) => (
              <View
                key={`${item.itemId || item.name || "item"}-${index}`}
                style={styles.itemRow}
              >
                <Text style={styles.itemName}>{item.name || "Gift item"}</Text>
                <Text style={styles.itemMeta}>Qty {item.quantity || 1}</Text>
              </View>
            ))}
          </View>

          {/* Recipient-only decline before fulfilment */}
          {order.perspective === "RECIPIENT" && order.canDecline && (
            <TouchableOpacity
              style={[styles.declineButton, declining && styles.buttonDisabled]}
              onPress={handleDecline}
              disabled={declining}
            >
              <Text style={styles.declineText}>
                {declining ? "Declining..." : "Decline this gift"}
              </Text>
            </TouchableOpacity>
          )}

          {order.perspective === "SENDER" && (
            <Text style={styles.privacyNote}>
              Fuse handles delivery. For privacy, the recipient's address is not
              shared with you.
            </Text>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("ChatListScreen")}
          >
            <Text style={styles.linkText}>Open chats</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Gift order unavailable.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); void loadOrder(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
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
  topRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Poppins-SemiBold",
    marginTop: 8,
  },
  value: {
    marginTop: 4,
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  trackingValue: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 12,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  bannerWarn: { backgroundColor: "#FDE8E8" },
  bannerMuted: { backgroundColor: "#F3F4F6" },
  bannerText: { color: "#1a1a1a", fontFamily: "Poppins-SemiBold", fontSize: 13 },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemName: { fontSize: 15, color: "#1a1a1a", fontFamily: "Poppins-SemiBold" },
  itemMeta: { marginTop: 4, fontSize: 13, color: "#6B7280", fontFamily: "Poppins" },
  declineButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FBC4C4",
    marginBottom: 14,
  },
  declineText: { color: "#B91C1C", fontFamily: "Poppins-SemiBold" },
  buttonDisabled: { opacity: 0.6 },
  privacyNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 18,
  },
  linkButton: { alignItems: "center", paddingVertical: 10 },
  linkText: { color: "#6B7280", fontFamily: "Poppins-SemiBold" },
  emptyText: { color: "#6B7280", fontFamily: "Poppins" },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#ff5864",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#ffffff" },
});
