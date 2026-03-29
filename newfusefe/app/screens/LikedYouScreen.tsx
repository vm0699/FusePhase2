import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomNav } from "../../components/BottomNav";
import { Heart, X, ArrowLeft } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const BASE_URL = "http://172.20.10.4:5000";

const extraFields = [
  { key: "college", emoji: "🎓" },
  { key: "work", emoji: "💼" },
  { key: "drinking", emoji: "🍷" },
  { key: "religion", emoji: "🕐" },
  { key: "zodiacSign", emoji: "♒" },
  { key: "ethnicity", emoji: "🌍" },
  { key: "politics", emoji: "🏛️" },
  { key: "smoking", emoji: "🚬" },
  { key: "languages", emoji: "🗣️" },
  { key: "pets", emoji: "🐶" },
];

export default function LikedYouScreen() {
  const [likedUsers, setLikedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compliment, setCompliment] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [showMatchBanner, setShowMatchBanner] = useState(false);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigation = useNavigation();

  const fetchLikedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return Alert.alert("Error", "No token found");

      const response = await fetch(`${BASE_URL}/api/likes/likedyou`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        const pendingOnly = (data.users || []).filter((u) => u.status !== "accepted");
        const deduped = [];
        const byId = new Map();
        (pendingOnly || []).forEach((entry) => {
          const id = entry?._id?.toString?.() || entry?._id;
          if (!id) return;
          const existing = byId.get(id);
          const preferChat = entry.chatId && !(existing && existing.chatId);
          if (!existing || preferChat) {
            byId.set(id, { ...(existing || {}), ...entry });
          }
        });
        byId.forEach((value) => deduped.push(value));
        setLikedUsers(deduped);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch");
      }
    } catch (error) {
      console.error("Error fetching liked users:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLikedUsers();
    }, [fetchLikedUsers])
  );

  const handleSendCompliment = async () => {
    if (!selectedUser || !selectedUser._id) return;

    const swipedUserId = selectedUser._id;
    const complimentText = compliment.trim();

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return;

      let complimentResult = null;
      if (complimentText) {
        const response = await fetch(`${BASE_URL}/api/chat/send-compliment`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ swipedUserId, compliment: complimentText }),
        });

        complimentResult = await response.json();
        if (!response.ok) throw new Error(complimentResult.message || "Compliment failed");
      }

      const swipeResult = await sendSwipeAction(swipedUserId, "like");

      setModalVisible(false);
      setCompliment("");
      setSelectedUser(null);
      setLikedUsers((prev) => prev.filter((u) => u._id !== swipedUserId));

      if (swipeResult?.isMatch && swipeResult?.chatId) {
        navigation.navigate("ChatScreen", {
          chatId: swipeResult.chatId,
          channelSid: swipeResult.twilioChannelSid || null,
          twilioChatChannelSid: swipeResult.twilioChannelSid || null,
          receiverId: swipedUserId,
          receiverUsername: selectedUser.name,
          actualReceiverId: swipedUserId,
          otherUser: swipeResult.otherUser || selectedUser,
          chatStatus: "accepted",
          showMatchedBanner: true,
          complimentPreview: null,
        });
      } else if (complimentResult?.chatId) {
        navigation.navigate("ChatScreen", {
          receiverId: swipedUserId,
          receiverUsername: selectedUser.name,
          chatId: complimentResult.chatId,
          twilioChatChannelSid: complimentResult.twilioChannelSid || complimentResult.chatChannelSid,
          channelSid: complimentResult.twilioChannelSid || complimentResult.chatChannelSid,
          chatStatus: complimentResult.status || "pending",
          complimentPreview: complimentResult.complimentPreview || complimentText,
          actualReceiverId: swipedUserId,
        });
      }

      if (complimentText) {
        Alert.alert("Success", "Compliment sent! Chat request created.");
      } else {
        Alert.alert("Success", "Like sent!");
      }
    } catch (error) {
      console.error("Compliment error:", error);
      Alert.alert("Error", "Failed to send compliment");
    }
  };

  const sendSwipeAction = async (swipedUserId, action) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) return null;

      const response = await fetch(`${BASE_URL}/api/profile/swipe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ swipedUserId, action }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Failed to record swipe");
      }

      return result;
    } catch (error) {
      console.error("Swipe action error:", error);
      throw error;
    }
  };

  const handleAccept = async () => {
    if (!expandedProfile?.chatId || isProcessing) return;
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Missing token");

      const response = await fetch(`${BASE_URL}/api/chat/handle-chat-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId: expandedProfile.chatId, action: "accept" }),
      });

      const result = await response.json();
      if (!response.ok && result.status !== "accepted") {
        throw new Error(result.message || "Accept failed");
      }

      navigation.navigate("ChatScreen", {
        chatId: expandedProfile.chatId,
        channelSid: expandedProfile.twilioChannelSid,
        twilioChatChannelSid: expandedProfile.twilioChannelSid,
        receiverId: expandedProfile._id,
        receiverUsername: expandedProfile.name,
        actualReceiverId: expandedProfile._id,
        chatStatus: "accepted",
        showMatchedBanner: true,
        complimentPreview: expandedProfile.complimentPreview ?? null,
      });
    } catch (error) {
      console.error("Accept error:", error);
      navigation.navigate("ChatScreen", {
        chatId: expandedProfile.chatId,
        channelSid: expandedProfile.twilioChannelSid,
        status: "accepted",
        showMatchedBanner: true,
        otherUser: expandedProfile,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!expandedProfile?.chatId || isProcessing) return;
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Missing token");

      const response = await fetch(`${BASE_URL}/api/chat/handle-chat-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId: expandedProfile.chatId, action: "reject" }),
      });

      const result = await response.json();
      if (!response.ok && !["rejected", "closed"].includes(result?.status)) {
        throw new Error(result.message || "Reject failed");
      }

      setLikedUsers((prev) =>
        prev.filter((u) => u.chatId !== expandedProfile.chatId && u._id !== expandedProfile._id)
      );
      setExpandedProfile(null);
    } catch (error) {
      console.error("Reject error:", error);
      setLikedUsers((prev) =>
        prev.filter((u) => u.chatId !== expandedProfile.chatId && u._id !== expandedProfile._id)
      );
      setExpandedProfile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E85B5B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.bgOrb, styles.bgOrbTop]} />
      <View style={[styles.bgOrb, styles.bgOrbBottom]} />

      {showMatchBanner && (
        <View style={styles.matchBanner}>
          <Text style={styles.matchBannerText}>Its a match!</Text>
        </View>
      )}

      {expandedProfile ? (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setExpandedProfile(null)} style={styles.backButton}>
            <ArrowLeft size={20} color="#2C1B17" />
          </TouchableOpacity>

          <View style={styles.profileContainer}>
            <Text style={styles.name}>{expandedProfile.name}</Text>

            {expandedProfile.photos?.map((photo, i) => (
              <View key={i} style={styles.mediaBlock}>
                <View style={styles.cardContainer}>
                  <Image source={{ uri: photo }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.overlayHeart}
                    onPress={() => {
                      setSelectedUser(expandedProfile);
                      setModalVisible(true);
                    }}
                  >
                    <Heart size={20} color="#E85B5B" />
                  </TouchableOpacity>
                </View>

                {expandedProfile.prompts?.[i] && (
                  <View style={styles.cardContainer}>
                    <View style={styles.promptCard}>
                      <Text style={styles.promptTitle}>{expandedProfile.prompts[i].question}</Text>
                      <Text style={styles.promptAnswer}>{expandedProfile.prompts[i].answer}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.overlayHeartPrompt}
                      onPress={() => {
                        setSelectedUser(expandedProfile);
                        setModalVisible(true);
                      }}
                    >
                      <Heart size={20} color="#E85B5B" />
                    </TouchableOpacity>
                  </View>
                )}

                {i === 0 && (
                  <>
                    {expandedProfile.complimentPreview ? (
                      <Text style={styles.statusText}>
                        Compliment: {expandedProfile.complimentPreview}
                      </Text>
                    ) : null}
                    <Text style={styles.statusText}>Status: {expandedProfile.status}</Text>
                    {expandedProfile.status === "pending" && expandedProfile.chatId ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.primaryAction, isProcessing && styles.disabledAction]}
                          disabled={isProcessing}
                          onPress={handleAccept}
                        >
                          <Text style={styles.primaryActionText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryAction, isProcessing && styles.disabledAction]}
                          disabled={isProcessing}
                          onPress={handleReject}
                        >
                          <Text style={styles.secondaryActionText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                )}

                {i === 0 && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.infoText}>🎂 {expandedProfile.dateOfBirth}</Text>
                    <Text style={styles.infoText}>👤 {expandedProfile.gender}</Text>
                    <Text style={styles.infoText}>📏 {expandedProfile.height}</Text>

                    <View style={styles.bubbleContainer}>
                      {expandedProfile.interests?.map((item, index) => (
                        <View key={index} style={styles.bubble}>
                          <Text style={styles.bubbleText}>💡 {item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.bubbleContainer}>
                      {expandedProfile.values?.map((item, index) => (
                        <View key={index} style={[styles.bubble, styles.valueBubble]}>
                          <Text style={styles.bubbleText}>💬 {item}</Text>
                        </View>
                      ))}
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.extraFieldRow}>
                      {extraFields.map(({ key, emoji }, idx) =>
                        expandedProfile[key] ? (
                          <View key={idx} style={[styles.bubble, styles.extraBubble]}>
                            <Text style={styles.bubbleText}>
                              {emoji} {expandedProfile[key]}
                            </Text>
                          </View>
                        ) : null
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <Text style={styles.header}>Liked Your Profile</Text>
            <Text style={styles.subheader}>
              {likedUsers.length > 0
                ? `${likedUsers.length} people have liked your profile`
                : "Here is who liked you recently"}
            </Text>
          </View>

          {likedUsers.length === 0 ? (
            <Text style={styles.noLikesText}>No likes yet</Text>
          ) : (
            <View style={styles.gridContainer}>
              {likedUsers.map((profile) => (
                <TouchableOpacity
                  key={profile._id}
                  style={styles.gridItem}
                  onPress={() => setExpandedProfile(profile)}
                >
                  <Image source={{ uri: profile.photos?.[0] }} style={styles.avatarGrid} />
                  <Text style={styles.miniProfileName} numberOfLines={1}>
                    {profile.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <X size={24} color="#2C1B17" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send a Compliment</Text>
            <TextInput
              placeholder="Type compliment..."
              placeholderTextColor="#9D958C"
              style={styles.input}
              value={compliment}
              onChangeText={setCompliment}
            />
            <TouchableOpacity style={styles.heartButton} onPress={handleSendCompliment}>
              <Heart size={20} color="#FFFFFF" />
              <Text style={styles.heartButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
    zIndex: 0,
  },
  bgOrbTop: {
    width: 260,
    height: 260,
    backgroundColor: "rgba(245, 188, 168, 0.25)",
    top: -90,
    right: -70,
  },
  bgOrbBottom: {
    width: 220,
    height: 220,
    backgroundColor: "rgba(232, 91, 91, 0.12)",
    bottom: 80,
    left: -90,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F3",
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  matchBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FDE4DF",
    alignItems: "center",
    zIndex: 2,
  },
  matchBannerText: {
    fontSize: 15,
    color: "#9F2E2E",
    fontFamily: "Poppins_600SemiBold",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0E5DA",
    padding: 20,
    marginBottom: 14,
    shadowColor: "#2C1B17",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    fontSize: 26,
    color: "#2C1B17",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
  subheader: {
    marginTop: 8,
    fontSize: 14,
    color: "#6F655E",
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  noLikesText: {
    fontSize: 15,
    color: "#7F766E",
    textAlign: "center",
    marginTop: 50,
    fontFamily: "Poppins_500Medium",
  },
  profileContainer: {
    marginBottom: 40,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0E5DA",
    marginBottom: 14,
    shadowColor: "#2C1B17",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  name: {
    fontSize: 24,
    color: "#2C1B17",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
  mediaBlock: {
    marginBottom: 18,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0E5DA",
    shadowColor: "#2C1B17",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    position: "relative",
  },
  image: {
    width: "100%",
    height: 400,
    borderRadius: 16,
  },
  overlayHeart: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0E5DA",
    elevation: 2,
  },
  overlayHeartPrompt: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0E5DA",
    elevation: 2,
  },
  promptCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0E5DA",
  },
  promptTitle: {
    fontSize: 15,
    color: "#6F655E",
    marginBottom: 12,
    fontFamily: "Poppins_500Medium",
  },
  promptAnswer: {
    fontSize: 24,
    lineHeight: 32,
    color: "#2C1B17",
    fontFamily: "Poppins_700Bold",
  },
  statusText: {
    marginTop: 6,
    fontSize: 14,
    color: "#4A403A",
    fontFamily: "Poppins_500Medium",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#E85B5B",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DDD3",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryActionText: {
    color: "#2C1B17",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  disabledAction: {
    opacity: 0.6,
  },
  detailsBox: {
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EFE4D9",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  infoText: {
    fontSize: 14,
    color: "#3F3530",
    marginVertical: 3,
    fontFamily: "Poppins_500Medium",
  },
  bubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  bubble: {
    backgroundColor: "#FCE8E3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    margin: 4,
  },
  valueBubble: {
    backgroundColor: "#E6F4EA",
  },
  extraBubble: {
    backgroundColor: "#E8F3F8",
  },
  bubbleText: {
    fontSize: 12,
    color: "#2C1B17",
    fontFamily: "Poppins_500Medium",
  },
  extraFieldRow: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(20, 11, 8, 0.45)",
    paddingHorizontal: 18,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#F0E5DA",
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    fontSize: 18,
    color: "#2C1B17",
    marginBottom: 12,
    fontFamily: "Poppins_700Bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E7DDD3",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 14,
    color: "#2C1B17",
    fontFamily: "Poppins_500Medium",
  },
  heartButton: {
    backgroundColor: "#E85B5B",
    borderRadius: 12,
    height: 46,
    alignSelf: "center",
    width: 136,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heartButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  miniProfileName: {
    fontSize: 15,
    color: "#2C1B17",
    fontFamily: "Poppins_600SemiBold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0E5DA",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#2C1B17",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarGrid: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginBottom: 8,
  },
});
