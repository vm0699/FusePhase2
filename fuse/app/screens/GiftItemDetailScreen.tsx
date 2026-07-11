import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

      // 2 — initiate payment; returns { paymentId, mode, providerOrderId, razorpayKeyId? }
      const payData = await giftApi.initiatePayment(intentId);
      const paymentMode = payData?.mode || "PLACEHOLDER";
      const paymentId = payData?.paymentId;
      if (!paymentId) throw new Error("Payment could not be initiated.");

      if (paymentMode === "RAZORPAY") {
        if (!payData.razorpayKeyId || !payData.providerOrderId) {
          throw new Error("Payment isn't fully set up yet. Please try again shortly.");
        }

        // 3a — open the native Razorpay checkout sheet and wait for the result.
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

        // 4a — confirm with the real signature from the checkout result.
        // (providerOrderId isn't part of the confirm contract — the backend
        // verifies against the value it already stored during initiate.)
        await finalizeAfterPayment(intentId, {
          paymentId,
          providerPaymentId: checkoutResult.razorpay_payment_id,
          signature: checkoutResult.razorpay_signature,
        });
        return;
      }

      // 3b/4b — PLACEHOLDER mode: no real payment sheet, confirm directly.
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
  }, [item, chatId, catalogItemId, finalizeAfterPayment, showPopup]);

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
});
