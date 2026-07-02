import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { Gift } from "lucide-react-native";
import { theme } from "../../../app/theme";
import type { GiftSuggestion } from "../../../app/api/exploreApi";

type Props = {
  item: GiftSuggestion;
  onPress: () => void;
  style?: any;
};

export default function GiftCard({ item, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.imageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Gift size={28} color={theme.colors.brand} strokeWidth={1.5} />
          </View>
        )}
        <View
          style={[
            styles.tierBadge,
            item.tier === "MID" && styles.tierMid,
          ]}
        >
          <Text style={styles.tierText}>{item.tier}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>₹{item.finalAmount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
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
    height: 110,
    backgroundColor: theme.colors.surfaceSunken,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.brandSofter,
    alignItems: "center",
    justifyContent: "center",
  },
  tierBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  tierMid: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  tierText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 10,
    color: theme.colors.brand,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 17,
  },
  price: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
    color: theme.colors.brand,
  },
});
