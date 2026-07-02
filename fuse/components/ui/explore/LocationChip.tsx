import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import { theme } from "../../../app/theme";

export default function LocationChip({ city = "Chennai" }: { city?: string }) {
  return (
    <View style={styles.chip}>
      <MapPin size={13} color={theme.colors.brand} strokeWidth={2.2} />
      <Text style={styles.text}>{city}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.brand,
    letterSpacing: 0.2,
  },
});
