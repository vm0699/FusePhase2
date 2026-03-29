import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

type Props = {
  title: string;
  mode?: "edit" | "onboarding";
  children: React.ReactNode;
  onBack?: () => void;
  onDone?: () => void;
};

export default function FuseFieldShell({
  title,
  mode = "edit",
  children,
  onBack,
  onDone,
}: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />

      {mode === "edit" ? (
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerPill} onPress={onBack}>
            <Text style={styles.headerSecondary}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{title}</Text>

          <TouchableOpacity style={styles.headerPill} onPress={onDone}>
            <Text style={styles.headerPrimary}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.onboardingSpacer} />
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  bgOrbOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFF0F2",
    top: -42,
    left: -48,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFE4E8",
    bottom: 120,
    right: -40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 14,
  },
  onboardingSpacer: {
    height: Platform.OS === "ios" ? 24 : 16,
  },
  headerPill: {
    minWidth: 76,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 12,
    fontSize: 22,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  headerSecondary: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  headerPrimary: {
    fontSize: 14,
    color: "#ff5864",
    fontFamily: "Poppins-Bold",
  },
  content: {
    flex: 1,
  },
});
