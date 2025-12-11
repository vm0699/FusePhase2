import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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

  return (
    <View style={styles.container}>
      {navItems.map(({ icon: Icon, label, route: routeName }) => (
        <TouchableOpacity
          key={routeName}
          style={[
            styles.navItem,
            (tabState ? tabState.routes[tabState.index]?.name : route.name) === routeName && styles.activeNavItem,
          ]}
          onPress={() => navigation.navigate(routeName)}
        >
          <View style={styles.iconWrapper}>
            <Icon
              size={24}
              color={
                (tabState ? tabState.routes[tabState.index]?.name : route.name) === routeName
                  ? "#acb7ae"
                  : "#666"
              }
            />
            {label === "Chats" && hasPendingChats && <View style={styles.redDot} />}
          </View>
          <Text
            style={[
              styles.navLabel,
              route.name === routeName && styles.activeNavLabel,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 2,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    marginTop: 4,
    fontSize: 10,
    color: "#666",
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: "#acb7ae",
  },
  activeNavLabel: {
    color: "#acb7ae",
    fontWeight: "600",
  },
  iconWrapper: {
    position: "relative",
  },
  redDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
  },
});
