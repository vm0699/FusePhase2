import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../../app/theme";

type Props = {
  label: string;
  subLabel?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function StickyCTABar({
  label,
  subLabel,
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.inner}>
        {subLabel && <Text style={styles.sub}>{subLabel}</Text>}
        <Pressable
          onPress={onPress}
          disabled={disabled || loading}
          style={({ pressed }) => [
            styles.button,
            (disabled || loading) && styles.buttonDisabled,
            pressed && !disabled && !loading && { opacity: 0.88 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>{label}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  inner: {
    gap: 8,
  },
  sub: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  button: {
    backgroundColor: theme.colors.brand,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
  },
  buttonText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.2,
  },
});
