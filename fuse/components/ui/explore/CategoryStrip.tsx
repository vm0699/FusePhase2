import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { Gift, Coffee, Ticket, Crown, Clock } from "lucide-react-native";
import { theme } from "../../../app/theme";

export type ExploreCategory = "gifts" | "dates" | "events" | "premium" | "soon" | string;

export type CategoryStripItem = {
  id: ExploreCategory;
  label: string;
  Icon: any;
  soon?: boolean;
};

const CATEGORIES: CategoryStripItem[] = [
  { id: "gifts", label: "Gifts", Icon: Gift },
  { id: "dates", label: "Dates", Icon: Coffee },
  { id: "events", label: "Events", Icon: Ticket },
  { id: "premium", label: "Premium", Icon: Crown },
  { id: "soon", label: "More soon", Icon: Clock, soon: true },
];

// "Meet People" mode categories — mapped to the Event.category schema enum.
export const SOCIAL_CATEGORIES: CategoryStripItem[] = [
  { id: "sports", label: "Run clubs", Icon: Ticket },
  { id: "social", label: "Meetups", Icon: Coffee },
  { id: "party", label: "Parties", Icon: Gift },
  { id: "music", label: "Gigs", Icon: Crown },
  { id: "workshop", label: "Workshops", Icon: Clock },
];

type Props = {
  activeCategory?: ExploreCategory | null;
  onSelect?: (cat: ExploreCategory) => void;
  categories?: CategoryStripItem[];
};

export default function CategoryStrip({ activeCategory, onSelect, categories }: Props) {
  const items = categories ?? CATEGORIES;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map(({ id, label, Icon, soon }) => {
        const isActive = activeCategory === id && !soon;
        return (
          <Pressable
            key={id}
            onPress={() => !soon && onSelect?.(id)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              soon && styles.chipSoon,
              pressed && !soon && { opacity: 0.8 },
            ]}
          >
            <Icon
              size={16}
              strokeWidth={2}
              color={
                soon
                  ? theme.colors.textTertiary
                  : isActive
                  ? theme.colors.brand
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                soon && styles.labelSoon,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.brandSoft,
    borderColor: theme.colors.brandBorder,
  },
  chipSoon: {
    borderStyle: "dashed",
    opacity: 0.55,
  },
  label: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  labelActive: {
    color: theme.colors.brand,
  },
  labelSoon: {
    color: theme.colors.textTertiary,
  },
});
