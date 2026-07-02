import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Ticket, Calendar, MapPin, X } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type Event, type TicketOrder } from "../api/exploreApi";
import {
  buildRazorpayHtml,
  parseRazorpayMessage,
} from "../utils/razorpayCheckout";

type RouteParams = { eventId: string };

const MAX_QUANTITY = 4;

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function EventTicketCheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { eventId } = (route.params || {}) as RouteParams;
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    paymentId: string;
    mode: "PLACEHOLDER" | "RAZORPAY";
    amount: number;
    keyId?: string | null;
    providerOrderId?: string | null;
  } | null>(null);

  useEffect(() => {
    exploreApi
      .getEventDetail(eventId)
      .then((res) => setEvent(res.event))
      .catch(() => {})
      .finally(() => setLoadingEvent(false));
  }, [eventId]);

  const total = event ? event.ticketPrice * quantity : 0;
  const maxQty = Math.min(
    MAX_QUANTITY,
    event?.maxPerOrder ?? MAX_QUANTITY,
    event?.availableSlots ?? MAX_QUANTITY
  );

  const handlePurchase = async () => {
    if (!event || purchasing) return;
    setPurchasing(true);
    try {
      const res = await exploreApi.initiateTicketPurchase({ eventId, quantity });

      setPendingOrder({
        orderId: res.orderId,
        paymentId: res.paymentId,
        mode: res.mode,
        amount: res.amount,
        keyId: res.keyId,
        providerOrderId: res.providerOrderId,
      });

      if (res.mode === "PLACEHOLDER") {
        await confirmTicketPayment(res.orderId, res.paymentId, null, null);
      } else {
        const html = buildRazorpayHtml({
          amount: res.amount,
          keyId: res.keyId ?? "",
          orderId: res.providerOrderId ?? "",
          description: `${quantity} ticket${quantity !== 1 ? "s" : ""} — ${event.title}`,
        });
        setPaymentHtml(html);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not initiate purchase. Try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const confirmTicketPayment = async (
    orderId: string,
    paymentId: string,
    providerPaymentId: string | null,
    signature: string | null
  ) => {
    try {
      const res = await exploreApi.confirmTicketPayment(orderId, {
        paymentId,
        providerPaymentId: providerPaymentId ?? undefined,
        signature: signature ?? undefined,
      });
      setPaymentHtml(null);
      setPendingOrder(null);
      showSuccess(res.order);
    } catch {
      Alert.alert("Error", "Payment confirmed but order update failed. Contact support.");
    }
  };

  const showSuccess = (order: TicketOrder) => {
    Alert.alert(
      "Tickets Confirmed! 🎉",
      `Your ${order.quantity} ticket${order.quantity !== 1 ? "s" : ""} for "${order.eventTitle}" are confirmed.\n\nTicket details and venue address will be sent via notification once our team processes them.`,
      [
        { text: "My Tickets", onPress: () => navigation.navigate("MyTicketOrders") },
        { text: "Done", onPress: () => navigation.navigate("ExploreHome") },
      ]
    );
  };

  const handleWebViewMessage = async (event: any) => {
    if (!pendingOrder) return;
    const result = parseRazorpayMessage(event.nativeEvent.data);
    if (!result) return;
    if (result === "dismiss") {
      setPaymentHtml(null);
      Alert.alert("Cancelled", "Payment was cancelled. Your tickets were not reserved.");
      return;
    }
    setPaymentHtml(null);
    if (result.success) {
      await confirmTicketPayment(
        pendingOrder.orderId,
        pendingOrder.paymentId,
        result.paymentId,
        result.signature
      );
    } else {
      await exploreApi.confirmTicketPayment(pendingOrder.orderId, {
        paymentId: pendingOrder.paymentId,
        status: "failed",
      });
      Alert.alert(
        "Payment Failed",
        result.error || "Payment could not be completed. Please try again.",
        [{ text: "Try Again" }]
      );
    }
  };

  if (loadingEvent || !event) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Get Tickets</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        {/* ─── Event summary card ──────────────────────────────────────────── */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <Calendar size={13} color={theme.colors.brand} strokeWidth={2} />
            <Text style={styles.eventMetaText}>{formatDate(event.eventDate)}</Text>
          </View>
          {event.venue && (
            <View style={styles.eventMeta}>
              <MapPin size={13} color={theme.colors.textTertiary} strokeWidth={2} />
              <Text style={styles.eventMetaText}>{event.venue}</Text>
            </View>
          )}
          {event.availableSlots != null && (
            <View style={styles.slotsRow}>
              <Ticket size={12} color={event.availableSlots < 10 ? "#DC2626" : "#059669"} strokeWidth={2} />
              <Text
                style={[
                  styles.slotsText,
                  { color: event.availableSlots < 10 ? "#DC2626" : "#059669" },
                ]}
              >
                {event.availableSlots} ticket{event.availableSlots !== 1 ? "s" : ""} remaining
              </Text>
            </View>
          )}
        </View>

        {/* ─── Quantity picker ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of tickets</Text>
          <View style={styles.quantityRow}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={[styles.qBtn, quantity <= 1 && styles.qBtnDisabled]}
              disabled={quantity <= 1}
            >
              <Text style={styles.qBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qValue}>{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              style={[styles.qBtn, quantity >= maxQty && styles.qBtnDisabled]}
              disabled={quantity >= maxQty}
            >
              <Text style={styles.qBtnText}>+</Text>
            </Pressable>
            <Text style={styles.qHint}>
              max {maxQty} per order
            </Text>
          </View>
        </View>

        {/* ─── Price breakdown ─────────────────────────────────────────────── */}
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Order summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              ₹{event.ticketPrice} × {quantity} ticket{quantity !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.priceValue}>₹{event.ticketPrice * quantity}</Text>
          </View>
          {event.savingsAmount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#059669" }]}>Fuse discount</Text>
              <Text style={[styles.priceValue, { color: "#059669" }]}>
                −₹{event.savingsAmount * quantity}
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
        </View>

        {/* ─── Notice ──────────────────────────────────────────────────────── */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Exact venue address and ticket reference will be shared after our team confirms your order (usually within a few hours).
          </Text>
        </View>

        {/* ─── CTA ─────────────────────────────────────────────────────────── */}
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || event.isSoldOut}
          style={({ pressed }) => [
            styles.cta,
            (purchasing || event.isSoldOut) && styles.ctaDisabled,
            pressed && !purchasing && !event.isSoldOut && { opacity: 0.88 },
          ]}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.ctaText}>
              {event.isSoldOut ? "Sold Out" : `Pay ₹${total}`}
            </Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Tickets are non-refundable after confirmation unless the event is cancelled.
        </Text>
      </ScrollView>

      {/* ─── Razorpay WebView modal ──────────────────────────────────────── */}
      <Modal
        visible={!!paymentHtml}
        animationType="slide"
        onRequestClose={() => setPaymentHtml(null)}
      >
        <View style={styles.webViewWrapper}>
          <View style={[styles.webViewHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <Pressable onPress={() => setPaymentHtml(null)} hitSlop={12}>
              <X size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
          {paymentHtml && (
            <WebView
              source={{ html: paymentHtml }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
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
    gap: 20,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  eventTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 2,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventMetaText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  slotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  slotsText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qBtnDisabled: {
    opacity: 0.4,
  },
  qBtnText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  qValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    minWidth: 32,
    textAlign: "center",
  },
  qHint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  priceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  priceTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  priceValue: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  totalAmount: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.colors.brand,
  },
  noticeCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  noticeText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: "#1D4ED8",
    lineHeight: 18,
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
  webViewWrapper: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  webViewTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});
