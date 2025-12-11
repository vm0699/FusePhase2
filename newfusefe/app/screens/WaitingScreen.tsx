import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import io from "socket.io-client";

const NGROK_SERVER_URL = "http://172.20.10.4:5000";
const SOCKET_SERVER = "wss://www.fusedating.co.in";

export default function WaitingScreen() {
  const navigation = useNavigation();
  const { userId, interests } = useRoute().params;
  const socket = useRef(null);
  const [waiting, setWaiting] = useState(true);
  const [matchedInterest, setMatchedInterest] = useState("");

  useEffect(() => {
    try {
      if (!userId || !interests) {
        console.warn("❌ Invalid params. userId or interests missing.");
        return navigation.goBack();
      }

      // Redacted: avoid logging userId/interests
      console.log("✅ WaitingScreen launched.");

      socket.current = io(SOCKET_SERVER, {
        path: "/socket.io",
        transports: ["websocket"],
        forceNew: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.current.on("connect", () => {
        const normalizedInterests = interests.map((i) => i.toLowerCase());
        // Redacted: avoid logging join payload
        console.log("✅ Connected to socket. Joining video queue.");
        socket.current.emit("join_video_queue", { userId, interests: normalizedInterests });
      });

      socket.current.on("match_found", async ({ matchedUserId, room, matchedInterest }) => {
        try {
          setWaiting(false);
          // Redacted: avoid logging matched user, room, or interest details
          console.log("🎯 Match found. Fetching token…");

          const result = await fetchAgoraToken(room);
          if (!result) {
            Alert.alert("Error", "Failed to generate video token.");
            return;
          }

          navigation.replace("AgoraCallScreen", {
            channelName: room,
            token: result.token,
            uid: result.uid,
          });
        } catch (matchErr) {
          console.error("❌ Error during match_found handler:", matchErr);
        }
      });

      socket.current.on("disconnect", () => console.log("❌ Socket Disconnected"));
      socket.current.on("connect_error", (err) => console.error("❌ Socket Error:", err));

      const timeout = setTimeout(() => {
        if (waiting) {
          Alert.alert("No match found", "Please try again later.");
          navigation.goBack();
        }
      }, 60000);

      return () => {
        clearTimeout(timeout);
        if (socket.current) socket.current.disconnect();
      };
    } catch (err) {
      console.error("❌ useEffect error in WaitingScreen:", err);
    }
  }, []);

  const fetchAgoraToken = async (channelName) => {
    try {
      const uid = Math.floor(Math.random() * 10000);
      // Redacted: avoid logging token URL or params
      console.log("🌐 Fetching Agora token…");

      const response = await fetch(`${NGROK_SERVER_URL}/api/agora/token?channelName=${channelName}&uid=${uid}`);
      const data = await response.json();
      if (data.token) {
        // Redacted: don't log token or uid
        return { token: data.token, uid };
      }
    } catch (error) {
      console.error("❌ Failed to fetch Agora token:", error);
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {waiting ? (
          <>
            <Text style={styles.heading}>🔍 Searching for a match...</Text>
            <ActivityIndicator size="large" color="#00BFFF" />
            <Text style={styles.dots}>.</Text>
          </>
        ) : (
          <>
            <Text style={styles.heading}>🎯 Match Found!</Text>
            {matchedInterest ? (
              <Text style={styles.matchText}>
                Shared interest: <Text style={styles.highlight}>{matchedInterest}</Text>
              </Text>
            ) : null}
            <Text style={styles.subtext}>Connecting you now...</Text>
          </>
        )}

        <Pressable
          style={[styles.cancelButton, !waiting && { opacity: 0.5 }]}
          onPress={() => navigation.goBack()}
          disabled={!waiting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#1c1c1e",
    padding: 30,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    width: "90%",
    alignItems: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5f5f5",
    marginBottom: 20,
    textAlign: "center",
  },
  subtext: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
  },
  matchText: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
  },
  highlight: {
    color: "#00E0FF",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 30,
    backgroundColor: "#ff3b30",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dots: {
    fontSize: 30,
    color: "#00BFFF",
    marginTop: 10,
  },
});
