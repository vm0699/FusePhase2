import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
} from "react-native";
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelMediaOptions,
  ClientRoleType,
  VideoSourceType,
} from "react-native-agora";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';

const APP_ID = "9f8005ccb3d34d7c9487f0de149a3111";

type AgoraCallParams = {
  params: {
    channelName: string;
    token: string;
    uid: number;
  };
};

export default function AgoraCallScreen() {
  const route = useRoute<RouteProp<AgoraCallParams, "params">>();
  const navigation = useNavigation();
  const { channelName, token, uid } = route.params;

  const [engine, setEngine] = useState<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteVideoOn, setRemoteVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const rtcEngine = createAgoraRtcEngine();
    rtcEngine.initialize({ appId: APP_ID });
    rtcEngine.enableVideo();
    rtcEngine.startPreview();

    rtcEngine.addListener("onJoinChannelSuccess", () => {
      setJoined(true);
    });

    rtcEngine.addListener("onUserJoined", (_, rUid) => {
      setRemoteUid(rUid);
    });

    rtcEngine.addListener("onUserOffline", () => {
      setRemoteUid(null);
    });

    rtcEngine.addListener("onUserMuteVideo", (rUid, muted) => {
      if (remoteUid === rUid) setRemoteVideoOn(!muted);
    });

    rtcEngine.joinChannel(token, channelName, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });

    setEngine(rtcEngine);
    return () => {
      rtcEngine.leaveChannel();
      rtcEngine.release();
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
    if (engine) {
      engine.leaveChannel();
      engine.release();
    }
    navigation.navigate("VideoInitiateScreen");
  };

  const skipUser = async () => {
    if (engine) {
      engine.leaveChannel();
      engine.release();
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "Login session expired. Please log in again.");
        navigation.navigate("LoginScreen");
        return;
      }

      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      const userId = decoded?.id ?? null;
      const interests = decoded?.interests ?? [];

      if (!userId) {
        Alert.alert("Error", "Failed to extract user ID.");
        return;
      }

      // Redacted: avoid logging userId/interests
      console.log("➡️ Skip user → navigating to WaitingScreen");

      navigation.navigate("WaitingScreen", {
        userId,
        interests,
      });
    } catch (err) {
      console.error("❌ skipUser error:", err);
      Alert.alert("Error", "Failed to process user information. Try again.");
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      setChatMessages([...chatMessages, `You: ${message}`]);
      setChatMessages((prev) => [...prev, `Stranger: ${message}`]); // Simulated
      setMessage("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <View style={styles.banner}>
        <BannerAd
          unitId="ca-app-pub-6755071267673135/6679397253"
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdFailedToLoad={(error) => console.warn('Ad load failed:', error)}
        />
      </View>

      <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
        <Ionicons name="exit-outline" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.videoContainer}>
        <View style={styles.videoBox}>
          {joined && videoOn ? (
            <RtcSurfaceView
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
              style={styles.video}
            />
          ) : (
            <View style={styles.videoOff}>
              <Ionicons name="videocam-off" size={50} color="#fff" />
              <Text style={styles.statusText}>Camera Off</Text>
            </View>
          )}
          <View style={styles.label}><Text style={styles.labelText}>You</Text></View>
        </View>

        <View style={styles.videoBox}>
          {remoteUid !== null ? (
            remoteVideoOn ? (
              <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.video} />
            ) : (
              <View style={styles.videoOff}>
                <Ionicons name="videocam-off" size={50} color="#fff" />
                <Text style={styles.statusText}>Camera Off</Text>
              </View>
            )
          ) : (
            <View style={styles.videoOff}>
              <Ionicons name="person" size={60} color="#666" />
              <Text style={styles.statusText}>Waiting for connection...</Text>
            </View>
          )}
          <View style={styles.label}><Text style={styles.labelText}>Stranger</Text></View>
        </View>
      </View>

      <View style={styles.chatContainer}>
        <ScrollView style={styles.chatBox}>
          {chatMessages.map((msg, idx) => (
            <Text key={idx} style={styles.chatText}>{msg}</Text>
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message"
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleVideo}>
          <Ionicons name={videoOn ? "videocam" : "videocam-off"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={skipUser}>
          <Ionicons name="play-skip-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  banner: {
    height: 60,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  bannerText: { color: "#fff", fontWeight: "bold", fontSize: 16, flex: 1 },
  leaveButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    left: 320,
  },
  videoContainer: { flex: 1, flexDirection: "column", padding: 8 },
  videoBox: {
    flex: 1,
    marginVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  video: { flex: 1 },
  videoOff: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 8,
  },
  label: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#222",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "#111",
    paddingVertical: 12,
  },
  controlButton: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#555",
  },
  chatContainer: {
    maxHeight: 160,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderColor: "#444",
  },
  chatBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxHeight: 100,
  },
  chatText: {
    color: "#fff",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#333",
    padding: 5,
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "#fff",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 20,
  },
});
