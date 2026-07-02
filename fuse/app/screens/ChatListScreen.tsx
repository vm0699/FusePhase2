import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MessageCircle } from "lucide-react-native";
import { BottomNav } from "../../components/BottomNav";
import { useProfile } from "../../ProfileContext";
import { useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../config/env";
import { theme } from "../theme";
import { Avatar, Card, EmptyState } from "../../components/ui";
import HeaderAvatar from "../../components/ui/HeaderAvatar";
import ChatListSkeleton from "../../components/skeletons/ChatListSkeleton";

const BASE_URL = API_BASE_URL;

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
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Chats</Text>
          <Text style={styles.subHeading}>Talk with people you matched with</Text>
        </View>
        <HeaderAvatar size={34} />
      </View>

      {loading ? (
        <ChatListSkeleton />
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            chats.length === 0 && styles.listContentEmpty,
          ]}
          data={chats}
          keyExtractor={(item) => item.chatId || item._id}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircle}
              title="No chats yet"
              message="When you match or accept a compliment, your conversations will show up here."
            />
          }
          renderItem={({ item }) => {
            if (!item.user || !item.user.name) {
              console.warn("User data missing for a chat item.");
              return null;
            }

            const profilePic =
              typeof item.user.photos?.[0] === "string"
                ? item.user.photos[0]
                : null;
            const isPending = item.status === "pending";

            return (
              <Card
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
              >
                <View style={styles.chatRow}>
                  <Avatar
                    uri={profilePic}
                    name={item.user.name}
                    size={52}
                    style={styles.avatar}
                  />
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
              </Card>
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <View style={styles.bottomNavWrapper}>
        <BottomNav />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 10,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.2,
  },
  subHeading: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 92,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  chatItem: {
    marginBottom: 12,
    borderRadius: 18,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
  },
  chatContent: { flex: 1 },
  chatName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-SemiBold",
  },
  complimentPreview: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontFamily: "Poppins",
  },
  lastMessageHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
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
    overflow: "hidden",
  },
  badgePending: { backgroundColor: theme.colors.brandSofter, color: theme.colors.brand },
  badgeMatched: { backgroundColor: theme.colors.successBg, color: theme.colors.successFg },
  bottomNavWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
