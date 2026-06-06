import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ClientRoleType,
  VideoSourceType,
} from "react-native-agora";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

const APP_ID = "9f8005ccb3d34d7c9487f0de149a3111";
const REMOTE_JOIN_TIMEOUT_MS = 25000;

type AgoraCallParams = {
  params: {
    channelName: string;
    token: string;
    uid: number;
    userId?: string;
    interests?: string[];
    matchedUserId?: string;
    matchedInterest?: string | null;
  };
};

export default function AgoraCallScreen() {
  const route = useRoute<RouteProp<AgoraCallParams, "params">>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    channelName,
    token,
    uid,
    userId,
    interests = [],
    matchedInterest,
  } = route.params;

  const [engine, setEngine] = useState<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteVideoOn, setRemoteVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const cleanupInProgressRef = useRef(false);
  const navigationInProgressRef = useRef(false);
  const remoteJoinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteUidRef = useRef<number | null>(null);

  const cleanupEngine = (rtcEngine?: IRtcEngine | null) => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    const target = rtcEngine || engine;
    try {
      target?.leaveChannel();
      target?.release();
    } catch (error) {
      console.warn("Agora engine cleanup warning:", error);
    } finally {
      cleanupInProgressRef.current = false;
    }
  };

  const requeueToWaiting = (reason?: string) => {
    if (navigationInProgressRef.current) return;
    navigationInProgressRef.current = true;

    cleanupEngine();

    if (!userId || !Array.isArray(interests) || interests.length === 0) {
      Alert.alert("Call ended", reason || "Returning to video setup.");
      navigation.replace("VideoInitiateScreen");
      return;
    }

    if (reason) {
      Alert.alert("Call ended", reason);
    }

    navigation.replace("WaitingScreen", {
      userId,
      interests,
    });
  };

  useEffect(() => {
    if (!channelName || !token || !uid) {
      Alert.alert("Error", "Missing video call details.");
      navigation.replace("VideoInitiateScreen");
      return;
    }

    const rtcEngine = createAgoraRtcEngine();
    rtcEngine.initialize({ appId: APP_ID });
    rtcEngine.enableVideo();
    rtcEngine.startPreview();

    rtcEngine.addListener("onJoinChannelSuccess", () => {
      setJoined(true);
    });

    rtcEngine.addListener("onUserJoined", (_, remoteParticipantUid) => {
      if (remoteJoinTimeoutRef.current) {
        clearTimeout(remoteJoinTimeoutRef.current);
        remoteJoinTimeoutRef.current = null;
      }
      remoteUidRef.current = remoteParticipantUid;
      setRemoteUid(remoteParticipantUid);
    });

    rtcEngine.addListener("onUserOffline", () => {
      remoteUidRef.current = null;
      setRemoteUid(null);
      requeueToWaiting("The other person left the call. Searching again.");
    });

    rtcEngine.addListener("onUserMuteVideo", (remoteParticipantUid, isMuted) => {
      if (remoteUidRef.current === remoteParticipantUid) {
        setRemoteVideoOn(!isMuted);
      }
    });

    rtcEngine.joinChannel(token, channelName, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });

    remoteJoinTimeoutRef.current = setTimeout(() => {
      if (!remoteUidRef.current) {
        requeueToWaiting("No one joined the call in time. Searching again.");
      }
    }, REMOTE_JOIN_TIMEOUT_MS);

    setEngine(rtcEngine);

    return () => {
      if (remoteJoinTimeoutRef.current) {
        clearTimeout(remoteJoinTimeoutRef.current);
      }
      cleanupEngine(rtcEngine);
    };
  }, []);

  const toggleMute = () => {
    if (engine) {
      engine.muteLocalAudioStream(!muted);
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (engine) {
      engine.muteLocalVideoStream(videoOn);
      setVideoOn(!videoOn);
    }
  };

  const handleLeave = () => {
    if (navigationInProgressRef.current) return;
    navigationInProgressRef.current = true;
    cleanupEngine();
    navigation.replace("VideoInitiateScreen");
  };

  const skipUser = () => {
    requeueToWaiting("Skipping to the next person.");
  };

  const handleSend = () => {
    if (message.trim()) {
      setChatMessages((prev) => [...prev, `You: ${message}`, `Stranger: ${message}`]);
      setMessage("");
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: 8 + insets.top,
          paddingBottom: 10 + Math.max(insets.bottom, 0),
        },
      ]}
    >
      <StatusBar style="dark" />
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />

      <View style={styles.topBar}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Random Video</Text>
          <Text style={styles.subtitle}>
            {matchedInterest ? `Matched on ${matchedInterest}` : "Connected room"}
          </Text>
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Ionicons name="exit-outline" size={18} color="#ffffff" />
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bannerCard}>
        <BannerAd
          unitId="ca-app-pub-6755071267673135/6679397253"
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdFailedToLoad={(error) => console.warn("Ad load failed:", error)}
        />
      </View>

      <View style={styles.videoContainer}>
        <View style={styles.videoBox}>
          {joined && videoOn ? (
            <RtcSurfaceView
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
              style={styles.video}
            />
          ) : (
            <View style={styles.videoOff}>
              <Ionicons name="videocam-off" size={44} color="#6B7280" />
              <Text style={styles.statusText}>Camera off</Text>
            </View>
          )}
          <View style={styles.label}>
            <Text style={styles.labelText}>You</Text>
          </View>
        </View>

        <View style={styles.videoBox}>
          {remoteUid !== null ? (
            remoteVideoOn ? (
              <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.video} />
            ) : (
              <View style={styles.videoOff}>
                <Ionicons name="videocam-off" size={44} color="#6B7280" />
                <Text style={styles.statusText}>Camera off</Text>
              </View>
            )
          ) : (
            <View style={styles.videoOff}>
              <Ionicons name="person" size={48} color="#9CA3AF" />
              <Text style={styles.statusText}>Waiting for connection...</Text>
            </View>
          )}
          <View style={styles.label}>
            <Text style={styles.labelText}>Stranger</Text>
          </View>
        </View>
      </View>

      <View style={styles.chatContainer}>
        <ScrollView style={styles.chatBox}>
          {chatMessages.map((msg, idx) => (
            <Text key={idx} style={styles.chatText}>
              {msg}
            </Text>
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={21} color="#1a1a1a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleVideo}>
          <Ionicons
            name={videoOn ? "videocam" : "videocam-off"}
            size={21}
            color="#1a1a1a"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={skipUser}>
          <Ionicons name="play-skip-forward" size={21} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  bgOrbOne: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFF0F2",
    top: -30,
    left: -25,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFE4E8",
    bottom: 26,
    right: -24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleWrap: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  title: {
    fontSize: 19,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },
  leaveButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff5864",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 6,
  },
  leaveText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  bannerCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  videoContainer: { flex: 1, flexDirection: "column", gap: 8 },
  videoBox: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    position: "relative",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  video: { flex: 1 },
  videoOff: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 8,
    fontFamily: "Poppins",
  },
  label: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  labelText: {
    color: "#1a1a1a",
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  controlButton: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skipButton: {
    backgroundColor: "#ff5864",
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ff5864",
  },
  chatContainer: {
    maxHeight: 170,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 8,
    overflow: "hidden",
  },
  chatBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 104,
  },
  chatText: {
    color: "#1a1a1a",
    marginBottom: 5,
    fontFamily: "Poppins",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    padding: 6,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: "#1a1a1a",
    fontFamily: "Poppins",
    fontSize: 13,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#ff5864",
    padding: 10,
    borderRadius: 999,
  },
});
