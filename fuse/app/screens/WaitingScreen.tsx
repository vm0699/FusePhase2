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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/env";

const SERVER_URL = API_BASE_URL;

export default function WaitingScreen() {
  const navigation = useNavigation();
  const { userId, interests } = useRoute().params;
  const socket = useRef(null);
  const waitingRef = useRef(true);
  const navigatedRef = useRef(false);
  const timeoutRef = useRef(null);
  const [waiting, setWaiting] = useState(true);
  const [matchedInterest, setMatchedInterest] = useState("");

  useEffect(() => {
    let isMounted = true;

    console.log("[video-client] waiting_screen_opened", {
      userId,
      interests,
      serverUrl: SERVER_URL,
    });

    const leaveQueueAndDisconnect = (reason = "left") => {
      if (socket.current) {
        console.log("[video-client] leaving_queue", { userId, reason });
        socket.current.emit("leave_video_queue", { userId, reason });
        socket.current.disconnect();
        socket.current = null;
      }
    };

    const fetchAgoraToken = async (channelName) => {
      try {
        const uid = Math.floor(Math.random() * 1000000) + 1;
        const jwtToken = await AsyncStorage.getItem("jwtToken");
        if (!jwtToken) {
          navigation.replace("Login");
          return null;
        }

        const response = await fetch(
          `${SERVER_URL}/api/agora/token?channelName=${encodeURIComponent(
            channelName
          )}&uid=${uid}`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch Agora token");
        }

        if (data.token) {
          return { token: data.token, uid: data.uid || uid };
        }
      } catch (error) {
        console.error("Failed to fetch Agora token:", error);
      }
      return null;
    };

    const handleMatchFound = async ({ matchedUserId, room, matchedInterest }) => {
      if (!isMounted || navigatedRef.current) return;

      try {
        waitingRef.current = false;
        setWaiting(false);
        setMatchedInterest(matchedInterest || "");
        navigatedRef.current = true;

        const result = await fetchAgoraToken(room);
        if (!result) {
          Alert.alert("Error", "Failed to generate video token.");
          navigatedRef.current = false;
          waitingRef.current = true;
          setWaiting(true);
          return;
        }

        leaveQueueAndDisconnect("matched");

        navigation.replace("AgoraCallScreen", {
          channelName: room,
          token: result.token,
          uid: result.uid,
          userId,
          interests,
          matchedUserId,
          matchedInterest: matchedInterest || null,
        });
      } catch (matchErr) {
        console.error("Error during match_found handler:", matchErr);
        navigatedRef.current = false;
        waitingRef.current = true;
        setWaiting(true);
      }
    };

    try {
      if (!userId || !interests) {
        console.warn("Invalid params. userId or interests missing.");
        return navigation.goBack();
      }

      if (!SERVER_URL) {
        console.error("[video-client] missing_server_url");
        Alert.alert("Error", "API base URL is missing.");
        return navigation.goBack();
      }

      socket.current = io(SERVER_URL, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 15000,
      });

      socket.current.on("connect", () => {
        const normalizedInterests = interests.map((i) => i.toLowerCase());
        console.log("[video-client] socket_connected", {
          socketId: socket.current?.id,
          userId,
          interests: normalizedInterests,
        });
        socket.current.emit("join_video_queue", {
          userId,
          interests: normalizedInterests,
        });
      });

      socket.current.on("queue_joined", () => {
        console.log("[video-client] queue_joined", { userId });
        waitingRef.current = true;
        setWaiting(true);
      });

      socket.current.on("match_found", (payload) => {
        console.log("[video-client] match_found", payload);
        handleMatchFound(payload);
      });

      socket.current.on("queue_error", (err) => {
        console.error("Queue error:", err);
        Alert.alert("Error", err?.message || "Failed to join video queue.");
      });

      socket.current.on("disconnect", () => {
        console.log("[video-client] socket_disconnected", { userId });
      });

      socket.current.on("connect_error", (err) => {
        console.error("[video-client] socket_connect_error", {
          userId,
          serverUrl: SERVER_URL,
          message: err?.message || null,
          description: err?.description || null,
          type: err?.type || null,
        });
      });

      timeoutRef.current = setTimeout(() => {
        if (waitingRef.current && !navigatedRef.current) {
          leaveQueueAndDisconnect("timeout");
          Alert.alert("No match found", "Please try again later.");
          navigation.goBack();
        }
      }, 60000);

      return () => {
        isMounted = false;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (!navigatedRef.current) {
          leaveQueueAndDisconnect("screen_unmount");
        }
      };
    } catch (err) {
      console.error("useEffect error in WaitingScreen:", err);
    }
  }, []);

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
