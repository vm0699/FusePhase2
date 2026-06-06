import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface ElevatedProfileCardProps {
  name: string;
  avatarUrl: string;
  completeness: number; // 0-100
}

export function ElevatedProfileCard({
  name,
  avatarUrl,
  completeness,
}: ElevatedProfileCardProps) {
  const progress = Math.max(0, Math.min(100, Math.round(completeness)));

  return (
    <View style={styles.card}>
      <View style={styles.avatarOuterShadow}>
        <View style={styles.avatarRing}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </View>
      </View>

      <Text style={styles.name}>{name}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.completenessText}>{progress}% Complete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 210,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 5,
  },
  avatarOuterShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#ff5864",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  name: {
    marginTop: 16,
    marginBottom: 8,
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  progressTrack: {
    width: 140,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ff5864",
  },
  completenessText: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Poppins",
  },
});
