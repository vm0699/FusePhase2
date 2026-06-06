import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Users, Heart, Video, MessageCircle } from "lucide-react-native";
import { useProfile } from "../ProfileContext";

const navItems = [
  { icon: User, label: "Profile", route: "Profile" },
  { icon: Video, label: "Video Call", route: "VideoInitiateScreen" },
  { icon: Users, label: "Swipe", route: "SwipeView" },
  { icon: Heart, label: "Liked You", route: "Liked You" },
  { icon: MessageCircle, label: "Chats", route: "ChatListScreen" },
];

export function BottomNav(props?: any) {
  const navigation = props?.navigation || useNavigation();
  const route = useRoute();
  const tabState = props?.state;
  const { hasPendingChats } = useProfile();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerWrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.container}>
        {navItems.map(({ icon: Icon, label, route: routeName }) => {
          const isActive =
            (tabState ? tabState.routes[tabState.index]?.name : route.name) === routeName;

          return (
            <TouchableOpacity
              key={routeName}
              style={[styles.navItem, isActive && styles.activeNavItem]}
              onPress={() => navigation.navigate(routeName)}
              activeOpacity={0.9}
            >
              <View style={[styles.iconBubble, isActive && styles.activeIconBubble]}>
                <Icon
                  size={20}
                  strokeWidth={2.3}
                  color={isActive ? "#ff5864" : "#6B7280"}
                />
                {label === "Chats" && hasPendingChats && <View style={styles.redDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 460,
    minHeight: 62,
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.64)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    borderRadius: 18,
  },
  activeNavItem: {
    transform: [{ translateY: -2 }],
  },
  iconBubble: {
    position: "relative",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(243,244,246,0.85)",
  },
  activeIconBubble: {
    backgroundColor: "#FFF1F3",
    borderWidth: 1,
    borderColor: "#FFD8DD",
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  redDot: {
    position: "absolute",
    top: 4,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ff5864",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});
