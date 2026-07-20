import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Ticket,
  ShieldCheck,
  Clock,
  Gift as GiftIcon,
  CheckCircle2,
} from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type Event, type EventRsvpStatus } from "../api/exploreApi";
import StickyCTABar from "../../components/ui/explore/StickyCTABar";
import { useExploreComingSoon } from "../../components/ui/explore/useExploreComingSoon";

type RouteParams = { eventId: string };

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

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { eventId } = (route.params || {}) as RouteParams;
  const insets = useSafeAreaInsets();
  const comingSoon = useExploreComingSoon(
    "Events on Fuse are launching soon in Chennai. Browse what's coming — tickets and RSVP open shortly!"
  );

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<EventRsvpStatus | null>(null);
  const [showMeInCircle, setShowMeInCircle] = useState(true);
  const [promoCode, setPromoCode] = useState<string | undefined>(undefined);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [checkInCodeInput, setCheckInCodeInput] = useState("");
  const [checkInBusy, setCheckInBusy] = useState(false);

  useEffect(() => {
    exploreApi
      .getEventDetail(eventId)
      .then((res) => {
        setEvent(res.event);
        setRsvpStatus(res.event.myRsvp?.status ?? null);
        setShowMeInCircle(res.event.myRsvp?.showMeInCircle ?? true);
        setPromoCode(res.event.promoCode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const isGoing = rsvpStatus === "GOING" || rsvpStatus === "CHECKED_IN";

  const handleRsvp = async () => {
    if (!event) return;
    setRsvpBusy(true);
    try {
      const res = await exploreApi.rsvpEvent(event._id, true);
      setRsvpStatus(res.rsvp.status);
      setShowMeInCircle(res.rsvp.showMeInCircle);
      if (res.promoCode) setPromoCode(res.promoCode);
    } catch (err: any) {
      Alert.alert("Couldn't RSVP", err?.message || "Please try again.");
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!event) return;
    setRsvpBusy(true);
    try {
      await exploreApi.cancelRsvp(event._id);
      setRsvpStatus("CANCELLED");
    } catch (err: any) {
      Alert.alert("Couldn't cancel", err?.message || "Please try again.");
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleToggleVisibility = async (value: boolean) => {
    if (!event) return;
    setShowMeInCircle(value);
    try {
      await exploreApi.updateRsvpVisibility(event._id, value);
    } catch {
      setShowMeInCircle(!value);
    }
  };

  const handleCheckIn = async () => {
    if (!event || !checkInCodeInput.trim()) return;
    setCheckInBusy(true);
    try {
      const res = await exploreApi.checkInEvent(event._id, checkInCodeInput.trim());
      setRsvpStatus("CHECKED_IN");
      if (res.badgeEarned) {
        Alert.alert("Badge earned! 🏅", "You've checked into 3 Fuse events — you're a Fuse Regular!");
      }
    } catch (err: any) {
      Alert.alert("Check-in failed", err?.message || "That code didn't work — try again.");
    } finally {
      setCheckInBusy(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  const isSoldOut = event.pricingType === "PAID_FUSE" && event.isSoldOut;
  const savings = event.savingsAmount ?? 0;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ─── Hero ──────────────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {event.images?.[0] ? (
            <Image source={{ uri: event.images[0] }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]} />
          )}
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { top: insets.top + 12 }]}
            hitSlop={8}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2.3} />
          </Pressable>
          {event.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          {isSoldOut && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          )}
        </View>

        {/* ─── Content ───────────────────────────────────────────────────── */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Date / time / venue chips */}
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Calendar size={13} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.chipText}>{formatDate(event.eventDate)}</Text>
            </View>
            <View style={styles.chip}>
              <Clock size={13} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.chipText}>{formatTime(event.eventDate)}</Text>
            </View>
          </View>

          {event.venue && (
            <View style={styles.detail}>
              <MapPin size={15} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.detailText}>{event.venue}</Text>
            </View>
          )}

          {event.availableSlots != null && !isSoldOut && (
            <View style={styles.detail}>
              <Users size={15} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.detailText}>
                {event.availableSlots} ticket{event.availableSlots !== 1 ? "s" : ""} left
              </Text>
            </View>
          )}

          {/* Savings banner */}
          {event.pricingType === "PAID_FUSE" && savings > 0 && (
            <View style={styles.savingsBanner}>
              <Ticket size={14} color="#059669" strokeWidth={2} />
              <Text style={styles.savingsText}>
                Save ₹{savings} per ticket — Fuse exclusive pricing!
              </Text>
            </View>
          )}

          {/* Who's going — Event Circle teaser */}
          {event.audience === "MEET_PEOPLE" && (
            <Pressable
              style={styles.circleTeaser}
              onPress={() => {
                if (comingSoon.gate()) return;
                if (isGoing) navigation.navigate("EventCircle", { eventId: event._id });
              }}
            >
              <Users size={16} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.circleTeaserText}>
                {event.goingCount > 0
                  ? `${event.goingCount} from Fuse going`
                  : "Be the first from Fuse to go"}
                {isGoing ? " · Tap to see who" : ""}
              </Text>
            </Pressable>
          )}

          {/* RSVP visibility toggle */}
          {isGoing && (
            <View style={styles.visibilityRow}>
              <Text style={styles.visibilityLabel}>Show me in the event circle</Text>
              <Switch value={showMeInCircle} onValueChange={handleToggleVisibility} />
            </View>
          )}

          {/* Check-in */}
          {event.audience === "MEET_PEOPLE" && rsvpStatus === "GOING" && (
            <View style={styles.checkInCard}>
              <Text style={styles.checkInLabel}>At the event? Check in with the code from the organizer.</Text>
              <View style={styles.checkInRow}>
                <TextInput
                  style={styles.checkInInput}
                  value={checkInCodeInput}
                  onChangeText={setCheckInCodeInput}
                  placeholder="4-digit code"
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <Pressable
                  style={styles.checkInBtn}
                  onPress={handleCheckIn}
                  disabled={checkInBusy || checkInCodeInput.trim().length < 4}
                >
                  {checkInBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.checkInBtnText}>Check in</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
          {rsvpStatus === "CHECKED_IN" && (
            <View style={styles.checkedInBanner}>
              <CheckCircle2 size={16} color="#059669" strokeWidth={2} />
              <Text style={styles.checkedInBannerText}>You're checked in!</Text>
            </View>
          )}

          {/* Promo code (PAID_EXTERNAL, revealed after RSVP) */}
          {promoCode && (
            <View style={styles.promoCard}>
              <GiftIcon size={16} color="#B45309" strokeWidth={2} />
              <Text style={styles.promoText}>
                Show code <Text style={styles.promoCode}>{promoCode}</Text> to the organizer for your Fuse offer.
              </Text>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.body}>{event.description}</Text>
            </View>
          )}

          {/* Extra info */}
          {(event.agePolicy || event.dressCode || event.importantInfo) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Important info</Text>
              {event.agePolicy && (
                <Text style={styles.infoItem}>🔞 {event.agePolicy}</Text>
              )}
              {event.dressCode && (
                <Text style={styles.infoItem}>👔 Dress code: {event.dressCode}</Text>
              )}
              {event.importantInfo && (
                <Text style={styles.infoItem}>ℹ️ {event.importantInfo}</Text>
              )}
            </View>
          )}

          {/* Safety */}
          <View style={styles.safetyCard}>
            <ShieldCheck size={16} color="#059669" strokeWidth={2} />
            <Text style={styles.safetyText}>
              Exact venue address shared after ticket confirmation for your safety.
            </Text>
          </View>

          {/* Pricing */}
          {event.pricingType === "PAID_FUSE" && (
            <View style={styles.priceCard}>
              <View>
                <Text style={styles.priceLabel}>Ticket price</Text>
                {event.maxPerOrder && (
                  <Text style={styles.priceSub}>
                    Max {event.maxPerOrder} per order
                  </Text>
                )}
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.price}>₹{event.ticketPrice}</Text>
                {event.originalPrice && event.originalPrice > event.ticketPrice && (
                  <Text style={styles.originalPrice}>₹{event.originalPrice}</Text>
                )}
              </View>
            </View>
          )}
          {event.pricingType === "PAID_EXTERNAL" && (
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Entry (via organizer)</Text>
              <Text style={styles.price}>{event.externalPrice || "See organizer"}</Text>
            </View>
          )}
          {event.pricingType === "FREE_RSVP" && (
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Entry</Text>
              <Text style={styles.price}>Free</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {event.pricingType === "PAID_EXTERNAL" && (
        <Pressable
          style={styles.secondaryRsvpBar}
          onPress={() => {
            if (comingSoon.gate()) return;
            isGoing ? handleCancelRsvp() : handleRsvp();
          }}
          disabled={rsvpBusy}
        >
          {rsvpBusy ? (
            <ActivityIndicator color={theme.colors.brand} size="small" />
          ) : (
            <Text style={styles.secondaryRsvpText}>
              {isGoing ? "Going ✓ · Tap to cancel" : "I'm going — join the circle"}
            </Text>
          )}
        </Pressable>
      )}

      <StickyCTABar
        label={
          event.pricingType === "FREE_RSVP"
            ? isGoing
              ? "Going ✓ · Cancel RSVP"
              : "RSVP — I'm going"
            : event.pricingType === "PAID_EXTERNAL"
            ? "Book via organizer"
            : isSoldOut
            ? "Sold Out"
            : "Get Tickets"
        }
        subLabel={
          event.pricingType === "FREE_RSVP"
            ? "Free · Cancel anytime"
            : event.pricingType === "PAID_EXTERNAL"
            ? event.externalPrice || "Booked directly with the organizer"
            : isSoldOut
            ? undefined
            : `₹${event.ticketPrice} per ticket · Address revealed after purchase`
        }
        onPress={() => {
          if (comingSoon.gate()) return;
          if (event.pricingType === "FREE_RSVP") {
            isGoing ? handleCancelRsvp() : handleRsvp();
          } else if (event.pricingType === "PAID_EXTERNAL") {
            if (event.externalBookingUrl) Linking.openURL(event.externalBookingUrl);
          } else {
            navigation.navigate("EventTicketCheckout", { eventId: event._id });
          }
        }}
        loading={rsvpBusy && event.pricingType === "FREE_RSVP"}
        disabled={event.pricingType === "PAID_FUSE" && isSoldOut}
      />
      {comingSoon.modal}
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
  heroWrap: {
    position: "relative",
  },
  hero: {
    width: "100%",
    height: 260,
    backgroundColor: theme.colors.surfaceSunken,
  },
  heroPlaceholder: {
    backgroundColor: "#EDE9FE",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  featuredBadge: {
    position: "absolute",
    bottom: 14,
    left: 16,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  featuredText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.brand,
  },
  soldOutOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    color: "#fff",
    letterSpacing: 1,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  savingsText: {
    flex: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: "#065F46",
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  infoItem: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  safetyText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: "#065F46",
    lineHeight: 18,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  priceLabel: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  priceSub: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  priceRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.colors.brand,
  },
  originalPrice: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textTertiary,
    textDecorationLine: "line-through",
  },
  circleTeaser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  circleTeaserText: {
    flex: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.brand,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  visibilityLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  promoText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  promoCode: {
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 0.5,
  },
  secondaryRsvpBar: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  secondaryRsvpText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.brand,
  },
  checkInCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  checkInLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  checkInRow: {
    flexDirection: "row",
    gap: 8,
  },
  checkInInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: theme.fontFamily.semibold,
    fontSize: 16,
    letterSpacing: 4,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  checkInBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInBtnText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
    color: "#fff",
  },
  checkedInBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  checkedInBannerText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: "#065F46",
  },
});
