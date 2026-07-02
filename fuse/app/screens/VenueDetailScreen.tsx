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
  MapPin,
  Star,
  Clock,
  Users,
  Tag,
  ShieldCheck,
} from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type Venue } from "../api/exploreApi";
import StickyCTABar from "../../components/ui/explore/StickyCTABar";

type RouteParams = { venueId: string };

export default function VenueDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { venueId } = (route.params || {}) as RouteParams;
  const insets = useSafeAreaInsets();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exploreApi
      .getVenueDetail(venueId)
      .then((res) => setVenue(res.venue))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading || !venue) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ─── Hero image ─────────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {venue.images?.[0] ? (
            <Image source={{ uri: venue.images[0] }} style={styles.hero} />
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
          {venue.isFuseVerified && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={13} color="#059669" strokeWidth={2} />
              <Text style={styles.verifiedText}>Fuse Verified</Text>
            </View>
          )}
        </View>

        {/* ─── Content ────────────────────────────────────────────────────── */}
        <View style={styles.content}>
          <Text style={styles.name}>{venue.name}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <MapPin size={13} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.chipText}>{venue.area}</Text>
            </View>
            {venue.rating != null && (
              <View style={styles.chip}>
                <Star size={13} color="#F59E0B" strokeWidth={2} />
                <Text style={styles.chipText}>{venue.rating.toFixed(1)}</Text>
                {venue.reviewCount != null && (
                  <Text style={styles.chipSub}>({venue.reviewCount})</Text>
                )}
              </View>
            )}
            {venue.priceRange && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{venue.priceRange}</Text>
              </View>
            )}
          </View>

          {/* Category + hours */}
          <View style={styles.detailRow}>
            {venue.category && (
              <View style={styles.detail}>
                <Tag size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.detailText}>{venue.category}</Text>
              </View>
            )}
            {venue.openingHours && (
              <View style={styles.detail}>
                <Clock size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.detailText}>{venue.openingHours}</Text>
              </View>
            )}
            {venue.maxPartySize && (
              <View style={styles.detail}>
                <Users size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.detailText}>Up to {venue.maxPartySize} guests</Text>
              </View>
            )}
          </View>

          {/* Discount */}
          {venue.hasDiscount && (
            <View style={styles.discountBanner}>
              <Tag size={14} color={theme.colors.brand} strokeWidth={2} />
              <Text style={styles.discountText}>
                Show Fuse booking to get {venue.dinerDiscountPct}% off your bill
              </Text>
            </View>
          )}

          {/* Description */}
          {venue.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.body}>{venue.description}</Text>
            </View>
          )}

          {/* Safety notice */}
          <View style={styles.safetyCard}>
            <ShieldCheck size={16} color="#059669" strokeWidth={2} />
            <Text style={styles.safetyText}>
              This is a public, Fuse-verified venue. Exact address is shared after booking
              confirmation for your safety.
            </Text>
          </View>

          {/* Booking fee */}
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Booking fee</Text>
            <Text style={styles.feeAmount}>₹{venue.bookingFee}</Text>
          </View>
        </View>
      </ScrollView>

      <StickyCTABar
        label="Book a table"
        subLabel={`₹${venue.bookingFee} booking fee · Address revealed after confirmation`}
        onPress={() =>
          navigation.navigate("BookingCheckout", { venueId: venue._id })
        }
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
    height: 280,
    backgroundColor: theme.colors.surfaceSunken,
  },
  heroPlaceholder: {
    backgroundColor: theme.colors.brandSofter,
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
  verifiedBadge: {
    position: "absolute",
    bottom: 14,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.93)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: "#059669",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  name: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  chipSub: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  detailRow: {
    gap: 8,
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
  discountBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  discountText: {
    flex: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.brand,
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
  feeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feeLabel: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  feeAmount: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.brand,
  },
});
