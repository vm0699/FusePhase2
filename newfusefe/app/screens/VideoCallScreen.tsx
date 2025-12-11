import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as Linking from "expo-linking";

type VideoCallScreenRouteParams = {
  room: string;
  twilioToken: string;
};

const NGROK_URL = "https://5944-2401-4900-9165-6c9a-201e-1a66-85b-68fa.ngrok-free.app"; // ✅ Update this when ngrok changes

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, VideoCallScreenRouteParams>, string>>();
  const { room, twilioToken } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!room || !twilioToken) {
      console.error("❌ Missing room or Twilio token", { room, twilioToken });
      Alert.alert("Error", "Missing room or Twilio token", [
        { text: "OK", onPress: () => navigation.replace("VideoInitiateScreen") },
      ]);
    } else {
      console.log("🌍 Twilio WebView URL:", `${NGROK_URL}/room/${room}?token=${twilioToken}&room=${room}`);

      if (Platform.OS === "web") {
        console.log("🔗 Opening video call in browser...");
        Linking.openURL(`${NGROK_URL}/room/${room}?token=${twilioToken}&room=${room}`);
      }
    }
  }, [room, twilioToken]);

  const handleLeaveCall = useCallback(() => {
    console.log("👋 Leaving call, navigating back...");
    navigation.navigate("VideoInitiateScreen");
  }, [navigation]);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <WebView
        key={reloadKey}
        source={{ uri: `${NGROK_URL}/room/${room}?token=${twilioToken}&room=${room}` }}
        style={styles.webView}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsProtectedMedia
        androidHardwareAccelerationDisabled={false}
        originWhitelist={["*"]}
        mediaPlaybackRequiresUserAction={false}

        // ✅ Critical fix for Android Camera/Mic
        onPermissionRequest={(event) => {
          console.log("📸🔊 WebView Permission Request:", event.nativeEvent.resources);
          event.nativeEvent.grant(event.nativeEvent.resources);
        }}

        onLoad={() => setLoading(false)}

        onMessage={(event) => {
          console.log("📩 WebView Message Received:", event.nativeEvent.data);
          if (event.nativeEvent.data === "LEAVE_CALL") {
            handleLeaveCall();
          }
        }}

        onError={() => {
          Alert.alert("WebView Error", "Failed to load Twilio video page.", [
            { text: "OK", onPress: handleLeaveCall },
          ]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
