import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Client as TwilioChatClient } from "twilio-chat";
import { useNavigation } from "@react-navigation/native";

import { chatApi } from "../api/chatApi";
import { createChatRealtime } from "../realtime/chatRealtime";


const BASE_URL = "http://172.20.10.4:5000";

const datingTips = [
  "💡 Compliment something specific, not generic.",
  "🗣️ Ask open-ended questions, not just 'Hey!'",
  "📌 Be yourself, not a highlight reel.",
  "⏳ Good things take time—like this chat loading!",
  "🤝 Keep it light, kind, and respectful.",
];

export default function ChatScreen({ route }) {
  const {
    receiverId,
    receiverUsername,
    twilioChatChannelSid,
    chatId,
    chatStatus,
    actualReceiverId,
    showMatchedBanner: showMatchedBannerParam = false,
    complimentPreview,
    channelSid,
  } = route.params;

  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const realtimeRef = useRef(null);


  // const [twilioToken, setTwilioToken] = useState(null);
  // const [client, setClient] = useState(null);
  // const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [realtimeReady, setRealtimeReady] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState(chatStatus);
  const [isReceiver, setIsReceiver] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showNewMessageBanner, setShowNewMessageBanner] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showMatchedBanner, setShowMatchedBanner] = useState(showMatchedBannerParam);
  const [bannerConsumed, setBannerConsumed] = useState(false);
  const [channelAvailable, setChannelAvailable] = useState(!!(channelSid || twilioChatChannelSid));
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);
  

  // if both sides have sent at least one message, allow chatting even if not 'accepted'
  const [bothChatted, setBothChatted] = useState(false);

  const initialChannelSid = channelSid || twilioChatChannelSid;
  const [activeChannelSid, setActiveChannelSid] = useState(initialChannelSid);

  useEffect(() => {
    setChannelAvailable(!!activeChannelSid);
    if (!activeChannelSid) {
      setLoading(false);
      Alert.alert("Chat channel unavailable", "Please reopen the chat.");
    }
  }, [activeChannelSid]);

  useEffect(() => {
  const init = async () => {
    await fetchUserData();
    // await fetchTwilioToken();
    await fetchChatHistory(); // 🔹 PHASE 2
  };
  init();
}, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prevIndex) => (prevIndex + 1) % datingTips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    const storedUserId = await AsyncStorage.getItem("userId");
    const storedUsername = await AsyncStorage.getItem("username");
    setUserId(storedUserId);
    setUsername(storedUsername);
    if (actualReceiverId && storedUserId === actualReceiverId) {
      setIsReceiver(true);
    }
  };

  const fetchTwilioToken = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) return;
      const response = await fetch(`${BASE_URL}/api/chat/twilio-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await response.json();
      if (response.ok && data.token) setTwilioToken(data.token);
    } catch (error) {
      console.error("Error fetching Twilio Token:", error);
    }
  };
  const fetchChatHistory = async () => {
  try {
    if (!chatId) return;

    const jwtToken = await AsyncStorage.getItem("jwtToken");
    if (!jwtToken) return;

    const res = await fetch(
      `${BASE_URL}/api/chat/${chatId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (!res.ok) {
      console.error("❌ Failed to fetch chat history");
      return;
    }

    const data = await res.json();

    console.log("🟣 [PHASE 2] DB messages loaded", data.messages?.length);

    const formatted = (data.messages || []).map((m) => ({
      id: m.id,
      authorId: m.authorId,
      body: m.body,
      timestamp: m.timestamp,
      _fromDB: true,
    }));

    setMessages(formatted);
    setLoading(false);
  } catch (err) {
    console.error("❌ Error loading chat history:", err);
  }
};


  // Initialize compliment preview as first bubble before history loads
  useEffect(() => {
    if (complimentPreview && status === "pending") {
      setMessages((prev) => {
        const already = prev.find((m) => m.sid === "local-compliment");
        if (already) return prev;
        return [
          {
            sid: "local-compliment",
            author: receiverUsername || "User",
            body: complimentPreview,
            _localCompliment: true,
          },
          ...prev,
        ];
      });
    }
  }, [complimentPreview, receiverUsername, status]);

useEffect(() => {
  if (!activeChannelSid || !userId || !username) return;

  console.log("🟣 [PRE-MIGRATION] Connecting realtime layer", {
    chatId,
    activeChannelSid,
  });

  const connectRealtime = async () => {
    const realtime = createChatRealtime("twilio");
    realtimeRef.current = realtime;

    await realtime.connect({
      channelSid: activeChannelSid,
      myUserId: userId,
      myUsername: username,
      otherUserId: receiverId,
      otherUsername: receiverUsername,
      onIncoming: (msg) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });

        if (!isAtBottom) setShowNewMessageBanner(true);
      },
    });

    // ✅ ADD THIS
    setRealtimeReady(true);
  };

  connectRealtime();

  return () => {
    realtimeRef.current?.disconnect();
    realtimeRef.current = null;

    // ✅ ADD THIS
    setRealtimeReady(false);
  };
}, [activeChannelSid, userId, username]);

//   useEffect(() => {
//     if (!twilioToken || !activeChannelSid) return;
//     const initTwilioClient = async () => {
//       try {
//         const twilioClient = client || (await TwilioChatClient.create(twilioToken));
//         if (!client) setClient(twilioClient);

//         const chatChannel = await twilioClient.getChannelBySid(activeChannelSid);
//         setChannel(chatChannel);
//         if (chatChannel.status !== "joined") await chatChannel.join();

//         chatChannel.on("messageAdded", (twilioMessage) => {
//   setMessages((prev) => {
//     // prevent duplicate echo (Twilio may echo own message)
//     const exists = prev.some(
//       (m) => m._twilioSid && m._twilioSid === twilioMessage.sid
//     );
//     if (exists) return prev;

//     const normalized = {
//       id: `rt-${twilioMessage.sid}`,
//       authorId:
//         twilioMessage.author === username
//           ? userId
//           : receiverId,
//       body: twilioMessage.body,
//       timestamp: new Date().toISOString(),
//       _fromRealtime: true,
//       _twilioSid: twilioMessage.sid,
//     };

//     return [...prev, normalized];
//   });

//   if (!isAtBottom) setShowNewMessageBanner(true);
// });


//       } catch (error) {
//         console.error("Error initializing Twilio client:", error);
//       }
//     };
//     initTwilioClient();

//     return () => {
//       if (client) {
//         client.shutdown();
//         setClient(null);
//       }
//     };
//   }, [twilioToken, activeChannelSid]);

  // compute if both parties have at least one message
  useEffect(() => {
    if (!username) {
      setBothChatted(false);
      return;
    }
    let my = false;
    let their = false;
    for (const m of messages) {
      const a = m?.author?.toLowerCase?.();
      if (!a) continue;
      if (username && a === username.toLowerCase()) my = true;
      else their = true; // in 1:1, any non-me author is the other person
      if (my && their) break;
    }
    setBothChatted(my && their);
  }, [messages, username]);

  // show matched banner once when status turns accepted
  // keep match banner visible for 5 seconds
useEffect(() => {
  if (status === "accepted" && showMatchedBanner) {
    const timer = setTimeout(() => {
      setShowMatchedBanner(false);
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [status, showMatchedBanner]);


  

  const sendMessage = async () => {
  if (status !== "accepted" && !bothChatted) {
    Alert.alert("Chat Locked", "The recipient hasn't accepted the chat yet.");
    return;
  }
  if (!channelAvailable) {
    Alert.alert("Chat channel unavailable", "Please reopen the chat.");
    return;
  }
  if (!realtimeRef.current || !message.trim()) return;

  const outgoing = message.trim();

  try {
    console.log("🟣 [PHASE 3] Sending realtime via Twilio", {
      chatId,
      outgoing,
    });

    // 1) Realtime send (Twilio) — keep current behavior
    // await channel.sendMessage(outgoing);
    await realtimeRef.current.send(outgoing);


    setMessage("");

    await chatApi.persistMessage(chatId, outgoing);

    // 2) Persist to DB (Mongo) — Phase 3
    // try {
    //   const jwtToken = await AsyncStorage.getItem("jwtToken");
    //   if (!jwtToken) {
    //     console.log("🟣 [PHASE 3] Missing jwtToken — cannot save to DB");
    //     return;
    //   }

    //   const res = await fetch(`${BASE_URL}/api/chat/${chatId}/messages`, {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${jwtToken}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ message: outgoing }),
    //   });

    //   const data = await res.json().catch(() => ({}));

    //   console.log("🟣 [PHASE 3] DB save response", {
    //     ok: res.ok,
    //     data,
    //   });
    // } catch (dbErr) {
    //   console.error("🔴 [PHASE 3] Failed to save message to DB:", dbErr);
    // }
  } catch (error) {
    console.error("Error sending message:", error);
    Alert.alert("Error", "Failed to send message.");
  }
};


  const handleAccept = async () => {
    if (!chatId) {
      Alert.alert("Error", "Chat missing. Please reopen from chat list.");
      return;
    }
    if (isUpdatingRequest) return;
    setIsUpdatingRequest(true);
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) return;
      const response = await fetch(`${BASE_URL}/api/chat/handle-chat-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, action: "accept" }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMsg = "Failed to accept chat.";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        }
        Alert.alert("Error", errorMsg);
        setIsUpdatingRequest(false);
        return;
      }

      const data = await response.json();
      if (data?.twilioChannelSid) {
        setActiveChannelSid(data.twilioChannelSid);
        setChannelAvailable(true);
      }
      Alert.alert("Success", "Chat accepted!");
      setStatus("accepted");
      setShowMatchedBanner(true);
    } catch (error) {
      console.error("Accept Chat Error:", error);
      Alert.alert("Error", "Something went wrong while accepting the chat.");
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const handleReject = async () => {
    if (!chatId) {
      Alert.alert("Error", "Chat missing. Please reopen from chat list.");
      return;
    }
    if (isUpdatingRequest) return;
    setIsUpdatingRequest(true);
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) return;
      const response = await fetch(`${BASE_URL}/api/chat/handle-chat-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, action: "reject" }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMsg = "Failed to reject chat.";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        }
        Alert.alert("Error", errorMsg);
        return;
      }

      await response.json().catch(() => ({}));
      setStatus("rejected");
      setChannelAvailable(false);
      Alert.alert("Chat rejected", "You declined this chat request.");
      navigation.goBack();
    } catch (error) {
      console.error("Reject Chat Error:", error);
      Alert.alert("Error", "Something went wrong while rejecting the chat.");
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowNewMessageBanner(false);
    setIsAtBottom(true);
  };

  const handleScroll = (e) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const bottomThreshold = 40;
    const isNowAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - bottomThreshold;
    setIsAtBottom(isNowAtBottom);
    if (isNowAtBottom) setShowNewMessageBanner(false);
  };

  const renderBanner = () => {
    if (!channelAvailable) {
      return (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>Chat channel unavailable. Please reopen chat.</Text>
        </View>
      );
    }
    if (showMatchedBanner && status === "accepted") {
      return (
        <View style={styles.matchedBanner}>
          <Text style={styles.matchedText}>🎉 It's a match! Say hi.</Text>
        </View>
      );
    }
    if (status === "pending" && !bothChatted) {
      return (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>Chat request pending. Waiting for acceptance.</Text>
          {isReceiver && (
            <View style={styles.pendingActions}>
              <TouchableOpacity
                style={[styles.acceptButton, isUpdatingRequest && { opacity: 0.6 }]}
                onPress={handleAccept}
                disabled={isUpdatingRequest}
              >
                <Text style={styles.acceptText}>Accept Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectButton, isUpdatingRequest && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={isUpdatingRequest}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 8}
    >
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff5864" />
          <Text style={styles.tipText}>{datingTips[tipIndex]}</Text>
        </View>
      </Modal>

        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerText}>{receiverUsername || "Chat"}</Text>
            </View>
          </View>

          {renderBanner()}

        <FlatList
          ref={flatListRef}
          data={messages}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item, index) => item.id || item.sid || index.toString()}
          onScroll={handleScroll}
          renderItem={({ item }) => {
            const isMyMessage = item.authorId && userId && item.authorId === userId;
            return (
              <View
                style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}
              >
                <Text style={[styles.username, isMyMessage && styles.myUsername]}>
                  {isMyMessage ? "You" : receiverUsername || "User"}
                </Text>
                <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                  {item.body}
                </Text>
              </View>
            );
          }}
        />

        {showNewMessageBanner && (
          <TouchableOpacity onPress={scrollToBottom} style={styles.newMessageBanner}>
            <Text style={styles.newMessageText}>1 new message 🔔</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            style={styles.input}
            editable={status === "accepted" || bothChatted}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendButton}
            disabled={!realtimeReady || (status !== "accepted" && !bothChatted)}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 58 : 40,
    paddingBottom: 12,
    backgroundColor: "#FAF8F3",
    position: "relative",
  },
  backButton: {
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 20,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
    marginTop: -1,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 58 : 40,
  },
  headerText: {
    fontSize: 22,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(250,248,243,0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tipText: {
    marginTop: 20,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Poppins",
    lineHeight: 21,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    margin: 8,
    borderRadius: 18,
    maxWidth: "75%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#ff5864",
    shadowColor: "#ff5864",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  username: {
    fontSize: 11,
    marginBottom: 3,
    color: "#9CA3AF",
    fontFamily: "Poppins-SemiBold",
  },
  myUsername: {
    color: "#FFE4E7",
  },
  messageText: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins",
    lineHeight: 21,
  },
  myMessageText: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 5,
    backgroundColor: "#FAF8F3",
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 25,
    fontSize: 15,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    fontFamily: "Poppins",
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: "#ff5864",
    borderRadius: 25,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
  lockedBanner: {
    backgroundColor: "#ffffff",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  lockedText: {
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 13,
  },
  acceptButton: {
    backgroundColor: "#ff5864",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    marginTop: 6,
    marginRight: 8,
  },
  acceptText: { color: "#fff", fontFamily: "Poppins-Bold", fontSize: 13 },
  pendingActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  rejectButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
  },
  rejectText: {
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  newMessageBanner: {
    backgroundColor: "#ff5864",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 5,
  },
  newMessageText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 13,
  },
  matchedBanner: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#D1FAE5",
  },
  matchedText: { color: "#059669", fontFamily: "Poppins-Bold", fontSize: 13 },
});
