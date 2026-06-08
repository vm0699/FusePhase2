import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FusePopupTone = "default" | "success" | "error" | "info";

type FusePopupProps = {
  visible: boolean;
  title: string;
  message?: string;
  tone?: FusePopupTone;
  actionLabel?: string;
  onClose: () => void;
  /** If provided, the main button becomes this action and a Cancel button is shown below */
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
};

const toneStyles: Record<FusePopupTone, { pillBg: string; pillText: string }> = {
  default: { pillBg: "#FFE4E7", pillText: "#ff5864" },
  success: { pillBg: "#ECFDF5", pillText: "#059669" },
  error: { pillBg: "#FEF2F2", pillText: "#DC2626" },
  info: { pillBg: "#EFF6FF", pillText: "#2563EB" },
};

export function FusePopup({
  visible,
  title,
  message,
  tone = "default",
  actionLabel = "Got it",
  onClose,
  primaryAction,
  secondaryAction,
}: FusePopupProps) {
  const theme = toneStyles[tone];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.badge, { backgroundColor: theme.pillBg }]}>
            <Text style={[styles.badgeText, { color: theme.pillText }]}>
              FUSE
            </Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          {primaryAction ? (
            <>
              <TouchableOpacity style={styles.button} onPress={primaryAction.onPress}>
                <Text style={styles.buttonText}>{primaryAction.label}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryAction ? secondaryAction.onPress : onClose}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryAction ? secondaryAction.label : "Cancel"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    paddingHorizontal: 22,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: "Poppins-Bold",
  },
  title: {
    color: "#1a1a1a",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "Poppins-Bold",
  },
  message: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  button: {
    marginTop: 18,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff5864",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
  secondaryButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
});
