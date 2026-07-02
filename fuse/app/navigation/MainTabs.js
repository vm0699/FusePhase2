import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SwipeView from "../screens/SwipeView";
import LikedYouScreen from "../screens/LikedYouScreen";
import ChatListScreen from "../screens/ChatListScreen";
import VideoInitiateScreen from "../screens/VideoInitiateScreen";
import ExploreHomeScreen from "../screens/ExploreHomeScreen";
import { BottomNav } from "../../components/BottomNav";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="SwipeView"
      lazy={false}
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false, unmountOnBlur: false, animation: "shift" }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="VideoInitiateScreen" component={VideoInitiateScreen} />
      <Tab.Screen name="ExploreHome" component={ExploreHomeScreen} />
      <Tab.Screen name="SwipeView" component={SwipeView} />
      <Tab.Screen name="Liked You" component={LikedYouScreen} />
      <Tab.Screen name="ChatListScreen" component={ChatListScreen} />
    </Tab.Navigator>
  );
}
