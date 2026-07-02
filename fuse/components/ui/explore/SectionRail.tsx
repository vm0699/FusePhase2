import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "../../../app/theme";

type Props = {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
};

export default function SectionRail({ title, onSeeAll, children }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} style={styles.seeAll} hitSlop={8}>
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight size={14} color={theme.colors.brand} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.brand,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
});
