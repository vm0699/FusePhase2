import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Skeleton from "../ui/Skeleton";
import { theme } from "../../app/theme";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 340;

/**
 * Skeleton for ProfileMain — mirrors the Hinge-style hero + stacked cards layout.
 */
export default function ProfileMainSkeleton() {
  return (
    <View style={styles.container}>
      {/* Hero photo placeholder */}
      <Skeleton width={width} height={HERO_HEIGHT} radius={0} />

      {/* Name + completeness bar below hero */}
      <View style={styles.heroFooter}>
        <Skeleton width={160} height={22} radius={8} />
        <Skeleton width={100} height={8} radius={4} style={{ marginTop: 10 }} />
      </View>

      {/* Preview card strip */}
      <View style={styles.card}>
        <Skeleton width={200} height={14} radius={6} />
        <Skeleton width={140} height={11} radius={5} style={{ marginTop: 8 }} />
      </View>

      {/* Vitals chip row */}
      <View style={[styles.card, styles.chipRow]}>
        {[80, 100, 72, 90].map((w, i) => (
          <Skeleton key={i} width={w} height={30} radius={999} />
        ))}
      </View>

      {/* Interests card */}
      <View style={styles.card}>
        <Skeleton width={80} height={11} radius={4} />
        <View style={styles.chipRow}>
          {[72, 96, 60, 84, 68].map((w, i) => (
            <Skeleton key={i} width={w} height={28} radius={999} />
          ))}
        </View>
      </View>

      {/* Info rows card */}
      <View style={styles.card}>
        <Skeleton width={90} height={11} radius={4} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.infoRow}>
            <Skeleton circle width={34} height={34} />
            <View style={{ flex: 1, gap: 5 }}>
              <Skeleton width={70} height={10} radius={4} />
              <Skeleton width={120} height={13} radius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  heroFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 0,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
});
