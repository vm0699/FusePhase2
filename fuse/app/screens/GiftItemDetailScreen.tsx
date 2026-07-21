import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import RazorpayCheckout from "react-native-razorpay";
import { giftApi } from "../api/giftApi";
import { FusePopup } from "../../components/FusePopup";

const OCCASION_MAP: Record<string, string> = {
  JUST_BECAUSE: "🎁 Just Because",
  FIRST_DATE: "🌹 First Date",
  CELEBRATION: "🎉 Celebration",
  THANK_YOU: "🙏 Thank You",
  APOLOGY: "💙 Apology",
};

export default function GiftItemDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chatId, catalogItemId, recipientName, recipientId } = route.params || {};

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  // UPI checkout state. `Linking.openURL` is fire-and-forget (no OS-level
  // result callback), so we watch AppState to notice when the user comes
  // back from the UPI app and proactively surface the "did you pay?" prompt
  // rather than requiring them to navigate back manually.
  const awaitingUpiReturnRef = useRef(false);
  const pendingUpiRef = useRef<{ intentId: string; paymentId: string } | null>(null);
  const [utrModalVisible, setUtrModalVisible] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [utrNote, setUtrNote] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);

  const [upiFallbackVisible, setUpiFallbackVisible] = useState(false);
  const upiFallbackIntentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && awaitingUpiReturnRef.current) {
        awaitingUpiReturnRef.current = false;
        setUtrModalVisible(true);
      }
    });
    return () => sub.remove();
  }, []);

  const showPopup = useCallback(
    (
      title: string,
      message?: string,
      tone: "default" | "success" | "error" | "info" = "default"
    ) => setPopup({ visible: true, title, message, tone }),
    []
  );

  const loadItem = useCallback(async () => {
    if (!catalogItemId) { setLoading(false); return; }
    try {
      const data = await giftApi.getCatalogItem(catalogItemId);
      setItem(data);
    } catch (err: any) {
      showPopup("Couldn't load gift", err?.message || "Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [catalogItemId, showPopup]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  // Shared tail: confirm the payment server-side, resolve the real order id,
  // and navigate to tracking — used by both the PLACEHOLDER and RAZORPAY paths
  // so they can never drift out of sync.
  const finalizeAfterPayment = useCallback(
    async (intentId: string, confirmPayload: Parameters<typeof giftApi.confirmPayment>[1]) => {
      const confirmData = await giftApi.confirmPayment(intentId, confirmPayload);

      let orderId =
        confirmData?.order?._id ||
        (confirmData?.order as any)?.orderId;

      // Defensive fallback: payment succeeded but the order id wasn't in the
      // confirm response (should not normally happen). Look it up via the
      // intent instead of guessing — never navigate to tracking with an id
      // that isn't a real order id (that 404s and looks like a hang).
      if (!orderId) {
        try {
          const intentDetails = await giftApi.getIntent(intentId);
          orderId = intentDetails?.order?.orderId || null;
        } catch {
          orderId = null;
        }
      }

      if (!orderId) {
        showPopup(
          "Payment received",
          "Your gift was paid for, but we couldn't load the tracking page just now. You'll find it under Profile → My Gifts.",
          "success"
        );
        return;
      }

      navigation.replace("GiftOrderTrackingScreen", { orderId, chatId });
    },
    [navigation, chatId, showPopup]
  );

  // Shared with the "no UPI app installed" fallback path below, so both the
  // primary flow and the fallback open the exact same checkout sheet.
  const payWithRazorpay = useCallback(
    async (intentId: string, paymentId: string, payData: any) => {
      if (!payData.razorpayKeyId || !payData.providerOrderId) {
        throw new Error("Payment isn't fully set up yet. Please try again shortly.");
      }

      let checkoutResult: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      };
      try {
        checkoutResult = await RazorpayCheckout.open({
          key: payData.razorpayKeyId,
          amount: Math.round((item.amount ?? item.finalAmount) * 100),
          currency: payData.currency || "INR",
          name: "Fuse",
          description: item.name,
          order_id: payData.providerOrderId,
          theme: { color: "#ff5864" },
        });
      } catch (checkoutError: any) {
        // Cancelled or failed inside the Razorpay sheet — not a system
        // error, so this is informational, not "Payment failed".
        showPopup(
          "Payment not completed",
          checkoutError?.description || "You can try again anytime.",
          "info"
        );
        return;
      }

      // Confirm with the real signature from the checkout result.
      // (providerOrderId isn't part of the confirm contract — the backend
      // verifies against the value it already stored during initiate.)
      await finalizeAfterPayment(intentId, {
        paymentId,
        providerPaymentId: checkoutResult.razorpay_payment_id,
        signature: checkoutResult.razorpay_signature,
      });
    },
    [item, finalizeAfterPayment, showPopup]
  );

  const handlePay = useCallback(async () => {
    if (!item || !chatId) return;
    setPaying(true);
    setConfirmVisible(false);
    try {
      // 1 — create intent; catalogItemId comes from route params (the real Mongo _id)
      const intentData = await giftApi.createIntent(chatId, {
        catalogItemId,
        quantity: 1,
      });
      const intentId = intentData?.giftIntentId || intentData?.intent?.intentId;
      if (!intentId) throw new Error("Failed to create gift intent.");

      // 2 — initiate payment; returns { paymentId, mode, providerOrderId, upiDeepLink?, razorpayKeyId? }
      const payData = await giftApi.initiatePayment(intentId);
      const paymentMode = payData?.mode || "UPI";
      const paymentId = payData?.paymentId;
      if (!paymentId) throw new Error("Payment could not be initiated.");

      if (paymentMode === "UPI") {
        if (!payData.upiDeepLink) {
          throw new Error("UPI payment link is not available right now.");
        }

        const canOpen = await Linking.canOpenURL(payData.upiDeepLink);
        if (!canOpen) {
          // No UPI app installed — offer the Razorpay fallback on the same
          // intent (do not create a second intent).
          upiFallbackIntentIdRef.current = intentId;
          setUpiFallbackVisible(true);
          return;
        }

        pendingUpiRef.current = { intentId, paymentId };
        awaitingUpiReturnRef.current = true;
        await Linking.openURL(payData.upiDeepLink);
        // The AppState listener picks up the return trip and shows the UTR
        // prompt — nothing more to do here.
        return;
      }

      if (paymentMode === "RAZORPAY") {
        await payWithRazorpay(intentId, paymentId, payData);
        return;
      }

      // PLACEHOLDER mode: no real payment sheet, confirm directly.
      await finalizeAfterPayment(intentId, {
        paymentId,
        providerPaymentId: "placeholder_pay_" + Date.now(),
        signature: "placeholder_signature",
      });
    } catch (err: any) {
      showPopup(
        "Payment failed",
        err?.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setPaying(false);
    }
  }, [item, chatId, catalogItemId, payWithRazorpay, finalizeAfterPayment, showPopup]);

  const handleNoUpiAppFallback = useCallback(async () => {
    const intentId = upiFallbackIntentIdRef.current;
    setUpiFallbackVisible(false);
    if (!intentId) return;
    setPaying(true);
    try {
      const payData = await giftApi.initiatePayment(intentId, { preferredMode: "RAZORPAY" });
      if (payData.mode !== "RAZORPAY" || !payData.paymentId) {
        throw new Error("Card/netbanking payment isn't available right now.");
      }
      await payWithRazorpay(intentId, payData.paymentId, payData);
    } catch (err: any) {
      showPopup(
        "Payment failed",
        err?.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setPaying(false);
    }
  }, [payWithRazorpay, showPopup]);

  const handleUtrSubmit = useCallback(async () => {
    const pending = pendingUpiRef.current;
    if (!pending || !utrInput.trim() || submittingUtr) return;
    setSubmittingUtr(true);
    try {
      await giftApi.confirmPayment(pending.intentId, {
        paymentId: pending.paymentId,
        utr: utrInput.trim(),
        note: utrNote.trim() || undefined,
      });
      setUtrModalVisible(false);
      setUtrInput("");
      setUtrNote("");
      pendingUpiRef.current = null;
      navigation.replace("GiftIntentDetailsScreen", { intentId: pending.intentId, chatId });
    } catch (err: any) {
      showPopup(
        "Couldn't submit payment",
        err?.message || "Please try again.",
        "error"
      );
    } finally {
      setSubmittingUtr(false);
    }
  }, [utrInput, utrNote, submittingUtr, navigation, chatId, showPopup]);

  const occasionLabel = item?.occasion ? OCCASION_MAP[item.occasion] || item.occasion : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gift Details</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : !item ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Gift not available.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); void loadItem(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image */}
          <View style={styles.imageWrap}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderEmoji}>🎁</Text>
              </View>
            )}
          </View>

          {/* Name + price */}
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.amount ?? item.finalAmount}</Text>

          {/* Occasion pill */}
          {!!occasionLabel && (
            <View style={styles.occasionRow}>
              <View style={styles.occasionPill}>
                <Text style={styles.occasionText}>{occasionLabel}</Text>
              </View>
            </View>
          )}

          {/* Privacy note */}
          <View style={styles.privacyCard}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Recipient's address is never shared with you. We handle delivery privately.
            </Text>
          </View>

          {/* Recipient */}
          {!!recipientName && (
            <View style={styles.recipientRow}>
              <Text style={styles.recipientLabel}>Sending to</Text>
              <Text style={styles.recipientName}>{recipientName}</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaButton, paying && styles.ctaButtonDisabled]}
            onPress={() => setConfirmVisible(true)}
            disabled={paying}
            activeOpacity={0.85}
          >
            {paying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.ctaText}>
                Send this Gift · ₹{item.amount ?? item.finalAmount}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Payment is processed securely. You'll see the order status after payment.
          </Text>
        </ScrollView>
      )}

      {/* Confirm popup */}
      <FusePopup
        visible={confirmVisible}
        title={`Send ${item?.name || "this gift"}?`}
        message={`You'll be charged ₹${item?.amount ?? item?.finalAmount}. The recipient will be notified once the order is placed.`}
        tone="default"
        onClose={() => setConfirmVisible(false)}
        primaryAction={{ label: "Confirm & Pay", onPress: handlePay }}
        secondaryAction={{ label: "Cancel", onPress: () => setConfirmVisible(false) }}
      />

      {/* Error/info popup */}
      <FusePopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        onClose={() => setPopup((p) => ({ ...p, visible: false }))}
      />

      {/* No UPI app installed — offer the Razorpay fallback on the same intent */}
      <FusePopup
        visible={upiFallbackVisible}
        title="No UPI app found"
        message="We couldn't find a UPI app (GPay, PhonePe, etc.) on this device. Pay with card / netbanking instead?"
        tone="info"
        onClose={() => setUpiFallbackVisible(false)}
        primaryAction={{ label: "Pay another way", onPress: handleNoUpiAppFallback }}
        secondaryAction={{ label: "Cancel", onPress: () => setUpiFallbackVisible(false) }}
      />

      {/* UPI return trip: ask the user to confirm they paid + enter the UTR */}
      <Modal
        transparent
        animationType="fade"
        visible={utrModalVisible}
        onRequestClose={() => setUtrModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setUtrModalVisible(false)}>
          <Pressable style={styles.utrCard} onPress={() => {}}>
            <Text style={styles.utrTitle}>Did you complete the payment?</Text>
            <Text style={styles.utrSubtitle}>
              Enter the UPI transaction reference (UTR) from your payment app. We'll verify it and
              confirm your gift shortly.
            </Text>
            <TextInput
              style={styles.utrInput}
              placeholder="UTR / transaction reference"
              placeholderTextColor="#9CA3AF"
              value={utrInput}
              onChangeText={setUtrInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.utrInput, styles.utrNoteInput]}
              placeholder="Note (optional)"
              placeholderTextColor="#9CA3AF"
              value={utrNote}
              onChangeText={setUtrNote}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.ctaButton,
                (!utrInput.trim() || submittingUtr) && styles.ctaButtonDisabled,
              ]}
              onPress={handleUtrSubmit}
              disabled={!utrInput.trim() || submittingUtr}
              activeOpacity={0.85}
            >
              {submittingUtr ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.ctaText}>Submit</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.utrCancelButton}
              onPress={() => setUtrModalVisible(false)}
            >
              <Text style={styles.utrCancelText}>I haven't paid yet</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 12,
  },
  backButton: {
    minWidth: 60,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  backText: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#6B7280" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Poppins-Bold", fontSize: 20, color: "#1a1a1a" },
  headerSpacer: { width: 60 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontFamily: "Poppins", fontSize: 14, color: "#9CA3AF" },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#ff5864",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#ffffff" },

  content: { paddingHorizontal: 20, paddingBottom: 40, alignItems: "center" },

  /* Image */
  imageWrap: {
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginTop: 8,
    marginBottom: 20,
    alignSelf: "center",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 64 },

  /* Name + price */
  itemName: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 6,
  },
  itemPrice: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    color: "#ff5864",
    marginBottom: 14,
  },

  /* Occasion */
  occasionRow: { marginBottom: 16 },
  occasionPill: {
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  occasionText: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#ff5864" },

  /* Privacy */
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  privacyIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  privacyText: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },

  /* Recipient */
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  recipientLabel: { fontFamily: "Poppins", fontSize: 13, color: "#9CA3AF" },
  recipientName: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#1a1a1a" },

  /* CTA */
  ctaButton: {
    backgroundColor: "#ff5864",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: "Poppins-Bold", fontSize: 16, color: "#ffffff" },

  footerNote: {
    fontFamily: "Poppins",
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },

  /* UTR entry modal */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  utrCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  utrTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  utrSubtitle: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 16,
  },
  utrInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  utrNoteInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  utrCancelButton: {
    marginTop: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  utrCancelText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#6B7280",
  },
});
