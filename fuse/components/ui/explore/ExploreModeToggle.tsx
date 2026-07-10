import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "../../../app/theme";
import type { ExploreMode } from "../../../app/api/exploreApi";

type Props = {
  mode: ExploreMode;
  onChange: (mode: ExploreMode) => void;
};

export default function ExploreModeToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.track}>
      <Pressable
        style={[styles.segment, mode === "dates" && styles.segmentActive]}
        onPress={() => onChange("dates")}
      >
        <Text style={[styles.label, mode === "dates" && styles.labelActive]}>Date Ideas</Text>
      </Pressable>
      <Pressable
        style={[styles.segment, mode === "people" && styles.segmentActive]}
        onPress={() => onChange("people")}
      >
        <Text style={[styles.label, mode === "people" && styles.labelActive]}>Meet People</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 16,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  labelActive: {
    color: theme.colors.brand,
  },
});
