import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Calendar, Users, Clock, X } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi from "../api/exploreApi";
import {
  buildRazorpayHtml,
  parseRazorpayMessage,
} from "../utils/razorpayCheckout";

type RouteParams = { venueId: string };

const TIME_SLOTS = [
  "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM",
  "2:00 PM", "7:00 PM",
  "7:30 PM", "8:00 PM",
  "8:30 PM", "9:00 PM",
];

const PARTY_SIZES = [1, 2, 3, 4];

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateString(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function BookingCheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { venueId } = (route.params || {}) as RouteParams;
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(getDateString(1));
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");
  const [bookingFee, setBookingFee] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    bookingId: string;
    paymentId: string;
    providerOrderId: string | null;
    amount: number;
    mode: "PLACEHOLDER" | "RAZORPAY";
    keyId?: string | null;
  } | null>(null);

  // Generate date options: today + 14 days
  const dateOptions = Array.from({ length: 14 }, (_, i) => getDateString(i + 1));

  const isValid = selectedDate.length > 0 && selectedTime.length > 0 && partySize > 0;

  const handleBook = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const bookRes = await exploreApi.createBooking({
        venueId,
        date: selectedDate,
        timeSlot: selectedTime,
        partySize,
        specialNotes: notes.trim() || undefined,
      });

      const payRes = await exploreApi.initiateBookingPayment(bookRes.bookingId);
      setBookingFee(payRes.amount);
      setPendingPayment({
        bookingId: bookRes.bookingId,
        paymentId: payRes.paymentId,
        providerOrderId: payRes.providerOrderId,
        amount: payRes.amount,
        mode: payRes.mode,
        keyId: payRes.keyId,
      });

      if (payRes.mode === "PLACEHOLDER") {
        await confirmPayment(bookRes.bookingId, payRes.paymentId, null, null, null);
      } else {
        const html = buildRazorpayHtml({
          amount: payRes.amount,
          keyId: payRes.keyId ?? "",
          orderId: payRes.providerOrderId ?? "",
          description: "Table booking at Fuse venue",
        });
        setPaymentHtml(html);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not create booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (
    bookingId: string,
    paymentId: string,
    providerPaymentId: string | null,
    signature: string | null,
    _status: "failed" | null
  ) => {
    try {
      await exploreApi.confirmBookingPayment(bookingId, {
        paymentId,
        providerPaymentId: providerPaymentId ?? undefined,
        signature: signature ?? undefined,
      });
      setPaymentHtml(null);
      setPendingPayment(null);
      Alert.alert(
        "Booking Confirmed! 🎉",
        "Your table is reserved. Venue address will be shared via notification. Enjoy your date!",
        [{ text: "View Bookings", onPress: () => navigation.navigate("MyBookings") },
         { text: "Done", onPress: () => navigation.navigate("ExploreHome") }]
      );
    } catch {
      Alert.alert("Error", "Payment verified but booking update failed. Contact support.");
    }
  };

  const handleWebViewMessage = async (event: any) => {
    if (!pendingPayment) return;
    const result = parseRazorpayMessage(event.nativeEvent.data);
    if (!result) return;
    if (result === "dismiss") {
      setPaymentHtml(null);
      Alert.alert("Cancelled", "Payment was cancelled. Your booking was not confirmed.");
      return;
    }
    setPaymentHtml(null);
    if (result.success) {
      await confirmPayment(
        pendingPayment.bookingId,
        pendingPayment.paymentId,
        result.paymentId,
        result.signature,
        null
      );
    } else {
      await exploreApi.confirmBookingPayment(pendingPayment.bookingId, {
        paymentId: pendingPayment.paymentId,
        status: "failed",
      });
      Alert.alert(
        "Payment Failed",
        result.error || "Payment could not be completed. Please try again.",
        [{ text: "Try Again" }]
      );
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
          <Text style={styles.headerTitle}>Book a Table</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 90 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Date ────────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Calendar size={16} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Pick a date</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroll}
            >
              {dateOptions.map((d) => {
                const dateObj = new Date(d + "T00:00:00");
                const day = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
                const num = dateObj.getDate();
                const isSelected = d === selectedDate;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setSelectedDate(d)}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  >
                    <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>
                      {day}
                    </Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>
                      {num}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ─── Time ────────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Clock size={16} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Pick a time</Text>
            </View>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTime(t)}
                  style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                >
                  <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ─── Party size ──────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Users size={16} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Party size</Text>
            </View>
            <View style={styles.partySizeRow}>
              {PARTY_SIZES.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setPartySize(n)}
                  style={[styles.sizeChip, partySize === n && styles.sizeChipActive]}
                >
                  <Text style={[styles.sizeText, partySize === n && styles.sizeTextActive]}>
                    {n}
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.sizeLabel}>
                {partySize === 1 ? "Just me" : `${partySize} people`}
              </Text>
            </View>
          </View>

          {/* ─── Notes ───────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special notes (optional)</Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g. window seat, birthday cake, vegetarian…"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* ─── Summary ─────────────────────────────────────────────────────── */}
          {isValid && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Booking summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{formatDisplayDate(selectedDate)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Party</Text>
                <Text style={styles.summaryValue}>{partySize} guest{partySize !== 1 ? "s" : ""}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Booking fee</Text>
                <Text style={styles.totalAmount}>₹{bookingFee ?? "—"}</Text>
              </View>
            </View>
          )}

          {/* ─── CTA ─────────────────────────────────────────────────────────── */}
          <Pressable
            onPress={handleBook}
            disabled={!isValid || loading}
            style={({ pressed }) => [
              styles.cta,
              (!isValid || loading) && styles.ctaDisabled,
              pressed && isValid && !loading && { opacity: 0.88 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.ctaText}>Confirm & Pay</Text>
            )}
          </Pressable>
          <Text style={styles.footer}>
            Booking fee is non-refundable after confirmation. Venue address shared post-payment.
          </Text>
        </ScrollView>
      </View>

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
  section: {
    gap: 10,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  dateScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    gap: 2,
  },
  dateChipActive: {
    backgroundColor: theme.colors.brandSoft,
    borderColor: theme.colors.brandBorder,
  },
  dateDay: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  dateDayActive: {
    color: theme.colors.brand,
  },
  dateNum: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  dateNumActive: {
    color: theme.colors.brand,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  timeChipActive: {
    backgroundColor: theme.colors.brandSoft,
    borderColor: theme.colors.brandBorder,
  },
  timeText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  timeTextActive: {
    color: theme.colors.brand,
  },
  partySizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sizeChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeChipActive: {
    backgroundColor: theme.colors.brandSoft,
    borderColor: theme.colors.brandBorder,
  },
  sizeText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  sizeTextActive: {
    color: theme.colors.brand,
  },
  sizeLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  textarea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    minHeight: 90,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  summaryTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  summaryTotal: {
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
    fontSize: 18,
    color: theme.colors.brand,
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
