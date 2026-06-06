import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const BRAND_COLOR = "#ff5864";

interface SegmentedTabItem {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  tabs: SegmentedTabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SegmentedControl({
  tabs,
  activeTab,
  onTabChange,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={[styles.tabButton, isActive && styles.activeTabButton]}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 64,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    height: "100%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabButton: {
    backgroundColor: "#FFF5F5",
  },
  tabText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
  activeTabText: {
    color: BRAND_COLOR,
  },
});
