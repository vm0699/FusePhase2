import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ProfileProvider } from "./ProfileContext";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";

// Auth + Onboarding
import Login from "./app/screens/Login";
import PhoneVerif from "./app/screens/PhoneVerif";
import CodeVerif from "./app/screens/CodeVerif";
import Intro from "./app/screens/Intro";
import ProfileSetup from "./app/screens/ProfileSetup";
import ProfileDetails from "./app/screens/ProfileDetails";
import PromptSelection from "./app/screens/PromptSelection";
import PhotoUpload from "./app/screens/PhotoUpload";
import Guidelines from "./app/screens/Guidelines";

// Main App Screens
import Home from "./app/screens/Home";
import Profile from "./app/screens/ProfileMain";
import SwipeView from "./app/screens/SwipeView";
import SettingsScreen from "./app/screens/Settings";

// Chats & Video
import ChatInitiateScreen from "./app/screens/ChatInitiateScreen";
import ChatListScreen from "./app/screens/ChatListScreen";
import ChatScreen from "./app/screens/ChatScreen";
import NotificationSettings from "./app/screens/NotificationSettings";
import SecuritySettings from "./app/screens/SecuritySettings";
import VideoCallScreen from "./app/screens/VideoCallScreen";
import VideoInitiateScreen from "./app/screens/VideoInitiateScreen";
import WaitingScreen from "./app/screens/WaitingScreen";

// Profile Update Screens
import UpdateProfilePage from "./app/screens/UpdateProfilePage";
import PronounsScreen from "./app/screens/PronounScreen";
import DatingIntentionsScreen from "./app/screens/DatingIntentions";
import PoliticsScreen from "./app/screens/Politics";
import ReligionScreen from "./app/screens/Religion";
import SexualityScreen from "./app/screens/SexualityScreen";
import WorkScreen from "./app/screens/Work";
import LanguagesScreen from "./app/screens/Languages";
import JobScreen from "./app/screens/JobTitle";
import HomeTownScreen from "./app/screens/HomeTown";
import EduLevelScreen from "./app/screens/EduLevel";
import CollegeScreen from "./app/screens/College";
import InterestsScreen from "./app/screens/Interests";

// Newly Added Screens
import EthnicityScreen from "./app/screens/EthnicityScreen";
import ChildrenScreen from "./app/screens/ChildrenScreen";
import PetsScreen from "./app/screens/PetsScreen";
import ZodiacScreen from "./app/screens/ZodiacSignScreen";
import DrinkingScreen from "./app/screens/DrinkingScreen";
import SmokingScreen from "./app/screens/SmokingScreen";
import MarijuanaScreen from "./app/screens/MarijuanaScreen";
import DrugsScreen from "./app/screens/DrugsScreen";

import FilterScreen from "./app/screens/FilterScreen";
import NewAdmirersScreen from "./app/screens/NewAdmirersScreen";
import NewMatchesScreen from "./app/screens/NewMatches";
import NewMessagesScreen from "./app/screens/NewMessages";
import ContactFAQScreen from "./app/screens/ContactFAQ";
import LikedYouScreen from "./app/screens/LikedYouScreen";

import VideoAutoplaySettingsScreen from "./app/screens/VideoAutoplaySettingsScreen";
import PrivacySettingsScreen from "./app/screens/PrivacySettingsScreen";
import TwilioNativeCallScreen from "./app/screens/TwilioNativeCallScreen";
import AgoraCallScreen from "./app/screens/vAgoraCallScreen";
import AuthGate from "./app/screens/AuthGate";
import MainTabs from "./app/navigation/MainTabs";
import OnboardingOptionalWrapper from "./app/screens/onboarding/OnboardingOptionalWrapper";
import LocationSetupScreen from "./app/screens/LocationSetupScreen";
import UpdateDeliveryLocation from "./app/screens/UpdateDeliveryLocation";
import GiftIntentDetailsScreen from "./app/screens/GiftIntentDetailsScreen";
import GiftOrderTrackingScreen from "./app/screens/GiftOrderTrackingScreen";
import { navigationRef } from "./app/navigation/navigationRef";
import { pushManager } from "./app/notifications/pushManager";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    'Poppins': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  React.useEffect(() => {
    if (
      Platform.OS === "android" &&
      typeof SystemUI.setLayoutModeAsync === "function"
    ) {
      void SystemUI.setLayoutModeAsync("immersive");
    }

    pushManager.start();

    return () => {
      pushManager.stop();
    };
  }, []);

  React.useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
    pushManager.onNavigationStateChange(navigationRef.getCurrentRoute()?.name);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ProfileProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" hidden />
        <NavigationContainer
          ref={navigationRef}
          onReady={onLayoutRootView}
          onStateChange={() =>
            pushManager.onNavigationStateChange(
              navigationRef.getCurrentRoute()?.name
            )
          }
        >
          <Stack.Navigator initialRouteName="AuthGate">
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="PhoneVerif" component={PhoneVerif} options={{ headerShown: false }} />
          <Stack.Screen name="CodeVerif" component={CodeVerif} options={{ headerShown: false }} />
          <Stack.Screen name="Intro" component={Intro} options={{ headerShown: false }} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetup} options={{ headerShown: false }} />
          <Stack.Screen name="LocationSetup" component={LocationSetupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OnboardingOptional" component={OnboardingOptionalWrapper} options={{ headerShown: false }} />
          <Stack.Screen name="ProfileDetails" component={ProfileDetails} options={{ headerShown: false }} />
          <Stack.Screen name="PromptSelection" component={PromptSelection} options={{ headerShown: false }} />
          <Stack.Screen name="PhotoUpload" component={PhotoUpload} options={{ headerShown: false }} />
          <Stack.Screen name="Guidelines" component={Guidelines} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
          <Stack.Screen name="SwipeView" component={SwipeView} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChatInitiateScreen" component={ChatInitiateScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChatListScreen" component={ChatListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettings} options={{ headerShown: false }} />
          <Stack.Screen name="SecuritySettings" component={SecuritySettings} options={{ headerShown: false }} />
          <Stack.Screen name="VideoCallScreen" component={VideoCallScreen} />
          <Stack.Screen name="VideoInitiateScreen" component={VideoInitiateScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WaitingScreen" component={WaitingScreen} options={{ headerShown: false }} />

          {/* Profile Edit Screens */}
          <Stack.Screen name="UpdateProfilePage" component={UpdateProfilePage} options={{ headerShown: false }} />
          <Stack.Screen name="PronounsScreen" component={PronounsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="College" component={CollegeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DatingIntentions" component={DatingIntentionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EduLevel" component={EduLevelScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HomeTown" component={HomeTownScreen} options={{ headerShown: false }} />
          <Stack.Screen name="JobTitle" component={JobScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Languages" component={LanguagesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Politics" component={PoliticsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Religion" component={ReligionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SexualityScreen" component={SexualityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Work" component={WorkScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Interests" component={InterestsScreen} options={{ headerShown: false }} />

          {/* Newly Added Fields */}
          <Stack.Screen name="Ethnicity" component={EthnicityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Children" component={ChildrenScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Pets" component={PetsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Zodiac" component={ZodiacScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Drinking" component={DrinkingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Smoking" component={SmokingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Marijuana" component={MarijuanaScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Drugs" component={DrugsScreen} options={{ headerShown: false }} />

          <Stack.Screen name="FilterScreen" component={FilterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="New Admirers" component={NewAdmirersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="New Matches" component={NewMatchesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="New Messages" component={NewMessagesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Contact FAQ" component={ContactFAQScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Liked You" component={LikedYouScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Video Autoplay" component={VideoAutoplaySettingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Privacy Settings" component={PrivacySettingsScreen} options={{ headerShown: false }} />

          <Stack.Screen name="AgoraCallScreen" component={AgoraCallScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuthGate" component={AuthGate} options={{ headerShown: false }} />
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="UpdateDeliveryLocation" component={UpdateDeliveryLocation} options={{ headerShown: false }} />
          <Stack.Screen name="GiftIntentDetailsScreen" component={GiftIntentDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GiftOrderTrackingScreen" component={GiftOrderTrackingScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ProfileProvider>
  );
}
