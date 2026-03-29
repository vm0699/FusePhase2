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
        console.warn("Invalid params. userId or interests missing.");
        return navigation.goBack();
      }

      console.log("WaitingScreen launched.");

      socket.current = io(SOCKET_SERVER, {
        path: "/socket.io",
        transports: ["websocket"],
        forceNew: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.current.on("connect", () => {
        const normalizedInterests = interests.map((i) => i.toLowerCase());
        console.log("Connected to socket. Joining video queue.");
        socket.current.emit("join_video_queue", {
          userId,
          interests: normalizedInterests,
        });
      });

      socket.current.on(
        "match_found",
        async ({ matchedUserId, room, matchedInterest }) => {
          try {
            setWaiting(false);
            setMatchedInterest(matchedInterest || "");
            console.log("Match found. Fetching token...");

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
            console.error("Error during match_found handler:", matchErr);
          }
        }
      );

      socket.current.on("disconnect", () =>
        console.log("Socket disconnected")
      );
      socket.current.on("connect_error", (err) =>
        console.error("Socket error:", err)
      );

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
      console.error("useEffect error in WaitingScreen:", err);
    }
  }, []);

  const fetchAgoraToken = async (channelName) => {
    try {
      const uid = Math.floor(Math.random() * 10000);
      console.log("Fetching Agora token...");

      const response = await fetch(
        `${NGROK_SERVER_URL}/api/agora/token?channelName=${channelName}&uid=${uid}`
      );
      const data = await response.json();
      if (data.token) {
        return { token: data.token, uid };
      }
    } catch (error) {
      console.error("Failed to fetch Agora token:", error);
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />

      <View style={styles.card}>
        {waiting ? (
          <>
            <Text style={styles.eyebrow}>Video Matchmaking</Text>
            <Text style={styles.heading}>Searching for a match...</Text>
            <ActivityIndicator size="large" color="#ff5864" />
            <Text style={styles.subtext}>
              Looking for someone with similar interests.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.eyebrow}>Video Matchmaking</Text>
            <Text style={styles.heading}>Match found</Text>
            {matchedInterest ? (
              <Text style={styles.matchText}>
                Shared interest:{" "}
                <Text style={styles.highlight}>{matchedInterest}</Text>
              </Text>
            ) : null}
            <Text style={styles.subtext}>Connecting you now...</Text>
          </>
        )}

        <Pressable
          style={[styles.cancelButton, !waiting && { opacity: 0.55 }]}
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
    backgroundColor: "#FAF8F3",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    overflow: "hidden",
  },
  bgOrbOne: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFF0F2",
    top: -40,
    left: -45,
  },
  bgOrbTwo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FFE4E8",
    bottom: 90,
    right: -35,
  },
  card: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    color: "#9CA3AF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 10,
  },
  heading: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  matchText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Poppins",
    lineHeight: 21,
  },
  highlight: {
    color: "#ff5864",
    fontFamily: "Poppins-Bold",
  },
  cancelButton: {
    marginTop: 24,
    backgroundColor: "#ff5864",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 999,
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  cancelText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
});
