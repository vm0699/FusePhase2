import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { Calendar, MapPin, Ticket } from "lucide-react-native";
import { theme } from "../../../app/theme";
import type { Event } from "../../../app/api/exploreApi";

type Props = {
  event: Event;
  onPress: () => void;
  style?: any;
};

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function EventCard({ event, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.imageWrap}>
        {event.images?.[0] ? (
          <Image source={{ uri: event.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {event.isSoldOut ? (
          <View style={[styles.badge, styles.soldOutBadge]}>
            <Text style={[styles.badgeText, { color: "#DC2626" }]}>Sold out</Text>
          </View>
        ) : event.savingsAmount > 0 ? (
          <View style={[styles.badge, styles.savingsBadge]}>
            <Text style={styles.badgeText}>
              Save ₹{event.savingsAmount}
            </Text>
          </View>
        ) : null}
        {event.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.row}>
          <Calendar size={12} color={theme.colors.textSecondary} strokeWidth={2} />
          <Text style={styles.meta}>{formatEventDate(event.eventDate)}</Text>
        </View>
        {event.venue && (
          <View style={styles.row}>
            <MapPin size={12} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.meta} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <View style={styles.row}>
            <Ticket size={12} color={theme.colors.brand} strokeWidth={2} />
            <Text style={styles.price}>₹{event.ticketPrice}</Text>
            {event.originalPrice && event.originalPrice > event.ticketPrice && (
              <Text style={styles.originalPrice}>₹{event.originalPrice}</Text>
            )}
          </View>
          {!event.isSoldOut && (
            <Text style={styles.slots}>{event.availableSlots} left</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
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
    backgroundColor: "#EDE9FE",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soldOutBadge: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  savingsBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 10,
    color: "#059669",
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  featuredText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 10,
    color: theme.colors.brand,
  },
  info: {
    padding: 10,
    gap: 5,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 19,
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
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  price: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
    color: theme.colors.brand,
  },
  originalPrice: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
    textDecorationLine: "line-through",
  },
  slots: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
});
