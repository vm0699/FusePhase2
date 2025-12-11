import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
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
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text style={styles.heading}>🗣️ Talk with People </Text>

          <FlatList
            contentContainerStyle={{ paddingTop: 30 }}
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
                      receiverId: item.user.id,
                      receiverUsername: item.user.name,
                      chatId: item.chatId || item._id,
                      channelSid: item.twilioChatChannelSid,
                      twilioChatChannelSid: item.twilioChatChannelSid,
                      chatStatus: item.status,
                      actualReceiverId: item.actualReceiverId,
                      complimentPreview: item.complimentPreview ?? null,
                      showMatchedBanner: item.status === "accepted" ? true : false,
                    });
                  }}
                  style={styles.chatItem}
                >
                  <View style={styles.chatRow}>
                    {profilePic ? (
                      <Image source={{ uri: profilePic }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chatName}>
                        {item.user.name || "Unknown User"}
                      </Text>
                      {isPending && item.complimentPreview ? (
                        <Text style={styles.complimentPreview} numberOfLines={1}>
                          Compliment: {item.complimentPreview}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.badge, isPending ? styles.badgePending : styles.badgeMatched]}>
                      {isPending ? "Pending" : "Matched"}
                    </Text>
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
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 10,
    color: "#000",
  },
  chatItem: {
    padding: 15,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    backgroundColor: "#ddd",
  },
  chatName: { fontSize: 18, fontWeight: "600", color: "#333" },
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  complimentPreview: { fontSize: 12, color: "#555", marginTop: 4 },
  badgeRow: { marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  badgePending: { backgroundColor: "#f0ad4e" },
  badgeMatched: { backgroundColor: "#5cb85c" },
});
