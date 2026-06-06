import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SwipeView from "../screens/SwipeView";
import LikedYouScreen from "../screens/LikedYouScreen";
import Profile from "../screens/ProfileMain";
import ChatListScreen from "../screens/ChatListScreen";
import VideoInitiateScreen from "../screens/VideoInitiateScreen";
import { BottomNav } from "../../components/BottomNav";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="SwipeView"
      lazy={false}
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false, unmountOnBlur: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="SwipeView" component={SwipeView} />
      <Tab.Screen name="Liked You" component={LikedYouScreen} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="ChatListScreen" component={ChatListScreen} />
      <Tab.Screen name="VideoInitiateScreen" component={VideoInitiateScreen} />
    </Tab.Navigator>
  );
}
