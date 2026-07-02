import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { Star, MapPin, Tag } from "lucide-react-native";
import { theme } from "../../../app/theme";
import type { Venue } from "../../../app/api/exploreApi";

type Props = {
  venue: Venue;
  onPress: () => void;
  style?: any;
};

export default function VenueCard({ venue, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.imageWrap}>
        {venue.images?.[0] ? (
          <Image source={{ uri: venue.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {venue.isFuseVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
        {venue.hasDiscount && (
          <View style={styles.discountBadge}>
            <Tag size={10} color={theme.colors.brand} strokeWidth={2} />
            <Text style={styles.discountText}>{venue.dinerDiscountPct}% off</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.row}>
          <MapPin size={12} color={theme.colors.textSecondary} strokeWidth={2} />
          <Text style={styles.meta} numberOfLines={1}>
            {venue.area}
          </Text>
          {venue.rating != null && (
            <>
              <View style={styles.dot} />
              <Star size={12} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.meta}>{venue.rating.toFixed(1)}</Text>
            </>
          )}
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.category}>{venue.category}</Text>
          <Text style={styles.fee}>₹{venue.bookingFee} booking fee</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 190,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: theme.colors.surfaceSunken,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.brandSofter,
  },
  verifiedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 10,
    color: "#059669",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  discountText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 10,
    color: theme.colors.brand,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.textTertiary,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  category: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  fee: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.brand,
  },
});
