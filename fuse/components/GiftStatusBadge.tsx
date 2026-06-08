import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, { bg: string; fg: string }> = {
  CREATED: { bg: "#F3F4F6", fg: "#6B7280" },
  PAID: { bg: "#E8F0FE", fg: "#2563EB" },
  ADMIN_REVIEW: { bg: "#FEF3C7", fg: "#B45309" },
  APPROVED: { bg: "#E8F0FE", fg: "#2563EB" },
  PROCESSING: { bg: "#FFF0E6", fg: "#C2410C" },
  FULFILLED: { bg: "#E7F8EF", fg: "#047857" },
  DELIVERED: { bg: "#E7F8EF", fg: "#047857" },
  CANCELLED: { bg: "#F3F4F6", fg: "#6B7280" },
  REFUND_REQUIRED: { bg: "#FDE8E8", fg: "#B91C1C" },
  REFUNDED: { bg: "#FDE8E8", fg: "#B91C1C" },
};

type Props = { status: string; label?: string };

export default function GiftStatusBadge({ status, label }: Props) {
  const c = COLORS[status] || COLORS.CREATED;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{label || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: { fontSize: 13, fontFamily: "Poppins-SemiBold" },
});
