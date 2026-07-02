import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
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
} from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type Event } from "../api/exploreApi";
import StickyCTABar from "../../components/ui/explore/StickyCTABar";

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

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exploreApi
      .getEventDetail(eventId)
      .then((res) => setEvent(res.event))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading || !event) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  const isSoldOut = event.isSoldOut;
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
          {savings > 0 && (
            <View style={styles.savingsBanner}>
              <Ticket size={14} color="#059669" strokeWidth={2} />
              <Text style={styles.savingsText}>
                Save ₹{savings} per ticket — Fuse exclusive pricing!
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
        </View>
      </ScrollView>

      <StickyCTABar
        label={isSoldOut ? "Sold Out" : "Get Tickets"}
        subLabel={
          isSoldOut
            ? undefined
            : `₹${event.ticketPrice} per ticket · Address revealed after purchase`
        }
        onPress={() =>
          navigation.navigate("EventTicketCheckout", { eventId: event._id })
        }
        disabled={isSoldOut}
      />
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
});
