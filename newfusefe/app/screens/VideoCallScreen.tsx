import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";

type VideoCallScreenRouteParams = {
  room: string;
  twilioToken: string;
};

const SERVER_URL = "http://172.20.10.4:5000";

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute<
    RouteProp<Record<string, VideoCallScreenRouteParams>, string>
  >();
  const { room, twilioToken } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!room || !twilioToken) {
      console.error("Missing room or Twilio token", { room, twilioToken });
      Alert.alert("Error", "Missing room or Twilio token", [
        { text: "OK", onPress: () => navigation.replace("VideoInitiateScreen") },
      ]);
    } else {
      console.log(
        "Twilio WebView URL:",
        `${SERVER_URL}/room/${room}?token=${twilioToken}&room=${room}`
      );

      if (Platform.OS === "web") {
        console.log("Opening video call in browser...");
        Linking.openURL(
          `${SERVER_URL}/room/${room}?token=${twilioToken}&room=${room}`
        );
      }
    }
  }, [room, twilioToken]);

  const handleLeaveCall = useCallback(() => {
    console.log("Leaving call, navigating back...");
    navigation.navigate("VideoInitiateScreen");
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />

      <View style={styles.topBar}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Video Call</Text>
          <Text style={styles.subtitle}>Live room active</Text>
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCall}>
          <Ionicons name="exit-outline" size={20} color="#ffffff" />
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webviewCard}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff5864" />
            <Text style={styles.loadingText}>Connecting call...</Text>
          </View>
        )}

        <WebView
          key={reloadKey}
          source={{
            uri: `${SERVER_URL}/room/${room}?token=${twilioToken}&room=${room}`,
          }}
          style={styles.webView}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          allowsProtectedMedia
          androidHardwareAccelerationDisabled={false}
          originWhitelist={["*"]}
          mediaPlaybackRequiresUserAction={false}
          onPermissionRequest={(event) => {
            console.log(
              "WebView Permission Request:",
              event.nativeEvent.resources
            );
            event.nativeEvent.grant(event.nativeEvent.resources);
          }}
          onLoad={() => setLoading(false)}
          onMessage={(event) => {
            console.log("WebView Message Received:", event.nativeEvent.data);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
    paddingTop: Platform.OS === "ios" ? 52 : 24,
    paddingHorizontal: 14,
    paddingBottom: 14,
    overflow: "hidden",
  },
  bgOrbOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FFF0F2",
    top: -40,
    left: -30,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFE4E8",
    bottom: 40,
    right: -32,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },
  leaveButton: {
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ff5864",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  leaveText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  webviewCard: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(250,248,243,0.9)",
    zIndex: 5,
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontFamily: "Poppins",
    fontSize: 13,
  },
});
