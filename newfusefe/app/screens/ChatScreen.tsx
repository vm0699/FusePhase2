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
import { Client as TwilioChatClient } from "twilio-chat";
import { useNavigation } from "@react-navigation/native";

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

  const [twilioToken, setTwilioToken] = useState(null);
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
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
      await fetchTwilioToken();
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
    if (!twilioToken || !activeChannelSid) return;
    const initTwilioClient = async () => {
      try {
        const twilioClient = client || (await TwilioChatClient.create(twilioToken));
        if (!client) setClient(twilioClient);

        const chatChannel = await twilioClient.getChannelBySid(activeChannelSid);
        setChannel(chatChannel);
        if (chatChannel.status !== "joined") await chatChannel.join();

        chatChannel.on("messageAdded", (message) => {
          setMessages((prev) => [...prev, message]);
          if (!isAtBottom) setShowNewMessageBanner(true);
        });

        const messagesPage = await chatChannel.getMessages();
        setMessages((prev) => [...prev, ...messagesPage.items]);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing Twilio client:", error);
      }
    };
    initTwilioClient();

    return () => {
      if (client) {
        client.shutdown();
        setClient(null);
      }
    };
  }, [twilioToken, activeChannelSid]);

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
    if (!channel || !message.trim()) return;
    try {
      await channel.sendMessage(message);
      setMessage("");
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
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
          keyExtractor={(item, index) => item.sid || index.toString()}
          onScroll={handleScroll}
          renderItem={({ item }) => {
            const isMyMessage = item.author?.toLowerCase?.() === username?.toLowerCase?.();
            return (
              <View
                style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}
              >
                <Text style={styles.username}>
                  {isMyMessage ? "You" : receiverUsername || "User"}
                </Text>
                <Text style={styles.messageText}>{item.body}</Text>
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
            disabled={status !== "accepted" && !bothChatted}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#ff5864",
    position: "relative",
  },
  backButton: { zIndex: 2 },
  backButtonText: { fontSize: 24, color: "#fff" },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tipText: {
    marginTop: 20,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    fontStyle: "italic",
  },
  messageBubble: {
    padding: 12,
    margin: 8,
    borderRadius: 20,
    maxWidth: "75%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#ff5864",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  username: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#555",
  },
  messageText: { fontSize: 16, color: "#000" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  sendButton: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ff5864",
    borderRadius: 25,
  },
  sendButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  lockedBanner: {
    backgroundColor: "#fff3cd",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ffeeba",
  },
  lockedText: { color: "#856404", fontWeight: "600", marginBottom: 8, textAlign: "center" },
  acceptButton: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 6,
    marginRight: 8,
  },
  acceptText: { color: "#fff", fontWeight: "600" },
  pendingActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  rejectButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  rejectText: {
    color: "#333",
    fontWeight: "600",
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
    fontWeight: "600",
    fontSize: 14,
  },
  matchedBanner: {
    backgroundColor: "#e6ffed",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#c3f0d7",
  },
  matchedText: { color: "#1b7f4a", fontWeight: "700" },
});
