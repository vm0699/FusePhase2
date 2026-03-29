import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomNav } from "../../components/BottomNav";
import { useProfile } from "../../ProfileContext";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "http://172.20.10.4:5000";

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setHasPendingChats } = useProfile();

  const fetchChats = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/chat/list`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const { chats } = await response.json();
        const normalized = (chats || []).map((chat) => ({
          ...chat,
          chatId: chat.chatId || chat._id,
          status: chat.status || "pending",
          complimentPreview: chat.complimentPreview,
          twilioChatChannelSid: chat.twilioChatChannelSid || chat.twilioChannelSid,
        }));

        setChats(normalized);

        const myId = await AsyncStorage.getItem("userId");
        const pending = normalized.filter(
          (chat) => chat.status === "pending" && chat.actualReceiverId === myId
        );
        const hasPending = pending.length > 0;
        setHasPendingChats(hasPending);
        await AsyncStorage.setItem("hasPendingChats", JSON.stringify(hasPending));
      } else {
        console.error("Failed to fetch chat list:", response.status);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchChats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff5864" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.heading}>Chats</Text>
            <Text style={styles.subHeading}>Talk with people you matched with</Text>
          </View>

          <FlatList
            contentContainerStyle={styles.listContent}
            data={chats}
            keyExtractor={(item) => item.chatId || item._id}
            renderItem={({ item }) => {
              if (!item.user || !item.user.name) {
                console.warn("User data missing for a chat item.");
                return null;
              }

              const profilePic = item.user.photos?.[0]
                ? `${BASE_URL}/uploads/${item.user.photos[0]}`
                : null;
              const isPending = item.status === "pending";

              return (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("ChatScreen", {
                      receiverId: item.user.id || item.user._id,
                      receiverUsername: item.user.name,
                      chatId: item.chatId || item._id,
                      channelSid: item.twilioChatChannelSid,
                      twilioChatChannelSid: item.twilioChatChannelSid,
                      chatStatus: item.status,
                      actualReceiverId: item.actualReceiverId,
                      complimentPreview: item.complimentPreview ?? null,
                      showMatchedBanner: false,
                    });
                  }}
                  style={styles.chatItem}
                  activeOpacity={0.9}
                >
                  <View style={styles.chatRow}>
                    {profilePic ? (
                      <Image source={{ uri: profilePic }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {(item.user.name || "?").slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.chatContent}>
                      <Text style={styles.chatName}>
                        {item.user.name || "Unknown User"}
                      </Text>
                      {isPending && item.complimentPreview ? (
                        <Text style={styles.complimentPreview} numberOfLines={1}>
                          Compliment: {item.complimentPreview}
                        </Text>
                      ) : (
                        <Text style={styles.lastMessageHint}>
                          Tap to open conversation
                        </Text>
                      )}
                    </View>
                    <View style={styles.badgeRow}>
                      <Text
                        style={[
                          styles.badge,
                          isPending ? styles.badgePending : styles.badgeMatched,
                        ]}
                      >
                        {isPending ? "Pending" : "Matched"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </>
      )}

      <View style={styles.bottomNavWrapper}>
        <BottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 10,
  },
  heading: {
    fontSize: 26,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.2,
  },
  subHeading: {
    marginTop: 2,
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 92,
  },
  chatItem: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE2E4",
  },
  avatarInitial: {
    color: "#ff5864",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  chatContent: { flex: 1 },
  chatName: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  complimentPreview: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "Poppins",
  },
  lastMessageHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    fontFamily: "Poppins",
  },
  badgeRow: { marginLeft: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  badgePending: { backgroundColor: "#FFF5F5", color: "#ff5864" },
  badgeMatched: { backgroundColor: "#ECFDF5", color: "#059669" },
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
