import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Visual stepped timeline for a gift order's happy path. Cancelled / refund
 * states are surfaced as a banner by the parent screen; this renders the
 * main fulfilment progression.
 */
const STEPS = [
  { key: "PAID", label: "Paid" },
  { key: "ADMIN_REVIEW", label: "Under review" },
  { key: "APPROVED", label: "Approved" },
  { key: "PROCESSING", label: "Being prepared" },
  { key: "FULFILLED", label: "Fulfilled" },
  { key: "DELIVERED", label: "Delivered" },
];

const ORDER_INDEX: Record<string, number> = STEPS.reduce(
  (acc, s, i) => ({ ...acc, [s.key]: i }),
  {}
);

type Props = { status: string };

export default function GiftStatusTimeline({ status }: Props) {
  // For terminal/refund states, anchor progress at the furthest reached step.
  let currentIndex = ORDER_INDEX[status];
  if (currentIndex === undefined) {
    if (status === "REFUND_REQUIRED" || status === "REFUNDED" || status === "CANCELLED") {
      currentIndex = 0; // paid reached, then diverted
    } else {
      currentIndex = -1;
    }
  }

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.markerColumn}>
              <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]}>
                {done && <Text style={styles.check}>✓</Text>}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    i < currentIndex ? styles.lineDone : styles.linePending,
                  ]}
                />
              )}
            </View>
            <Text style={[styles.label, done ? styles.labelDone : styles.labelPending]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  row: { flexDirection: "row" },
  markerColumn: { alignItems: "center", width: 28 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: "#ff5864" },
  dotPending: { backgroundColor: "#E5E7EB" },
  check: { color: "#fff", fontSize: 12, fontFamily: "Poppins-Bold" },
  line: { width: 2, flex: 1, minHeight: 22 },
  lineDone: { backgroundColor: "#ff5864" },
  linePending: { backgroundColor: "#E5E7EB" },
  label: {
    marginLeft: 12,
    paddingBottom: 18,
    fontSize: 14,
  },
  labelDone: { color: "#1a1a1a", fontFamily: "Poppins-SemiBold" },
  labelPending: { color: "#9CA3AF", fontFamily: "Poppins" },
});
