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
  { key: "religion", emoji: "🗐" },
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
      console.error("❌ Error fetching liked users:", error);
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
      console.error("ƒ?O Compliment Error:", error);
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
      console.error("??O Swipe Action Error:", error);
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
        status: "accepted",
        showMatchedBanner: true,
        otherUser: expandedProfile,
        complimentPreview: expandedProfile.complimentPreview ?? null,
        chatStatus: "accepted",
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

      setLikedUsers((prev) => prev.filter((u) => u.chatId !== expandedProfile.chatId && u._id !== expandedProfile._id));
      setExpandedProfile(null);
    } catch (error) {
      console.error("Reject error:", error);
      setLikedUsers((prev) => prev.filter((u) => u.chatId !== expandedProfile.chatId && u._id !== expandedProfile._id));
      setExpandedProfile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ff5864" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showMatchBanner && (
        <View style={{ backgroundColor: "#ffdbdb", padding: 10, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#d32f2f" }}>💖 It's a Match!</Text>
        </View>
      )}

      {expandedProfile ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity onPress={() => setExpandedProfile(null)} style={{ padding: 10 }}>
            <ArrowLeft size={24} color="#333" />
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
                      setSelectedUser(expandedProfile); // ✅ full profile
                      setModalVisible(true);
                    }}
                  >
                    <Heart size={24} color="#ff5864" />
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
                        setSelectedUser(expandedProfile); // ✅ full profile
                        setModalVisible(true);
                      }}
                    >
                      <Heart size={24} color="#ff5864" />
                    </TouchableOpacity>
                  </View>
                )}

                {i === 0 && (
                  <>
                    {expandedProfile.complimentPreview ? (
                      <Text style={{ marginTop: 8, fontSize: 14 }}>
                        Compliment: {expandedProfile.complimentPreview}
                      </Text>
                    ) : null}
                    <Text style={{ fontSize: 14 }}>
                      Status: {expandedProfile.status}
                    </Text>
                    {expandedProfile.status === "pending" && expandedProfile.chatId ? (
                      <View style={{ flexDirection: "row", marginTop: 8 }}>
                        <TouchableOpacity
                          style={[styles.overlayHeart, { flex: 1, marginRight: 8, opacity: isProcessing ? 0.6 : 1 }]}
                          disabled={isProcessing}
                          onPress={handleAccept}
                        >
                          <Text style={{ color: "#ff5864", fontWeight: "700" }}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.overlayHeart, { flex: 1, backgroundColor: "#f5f5f5", opacity: isProcessing ? 0.6 : 1 }]}
                          disabled={isProcessing}
                          onPress={handleReject}
                        >
                          <Text style={{ color: "#333", fontWeight: "700" }}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                )}
                {i === 0 && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.infoText}>🎂 {expandedProfile.dateOfBirth}</Text>
                    <Text style={styles.infoText}>👤 {expandedProfile.gender}</Text>
                    <Text style={styles.infoText}>📋 {expandedProfile.height}</Text>

                    <View style={styles.bubbleContainer}>
                      {expandedProfile.interests?.map((item, index) => (
                        <View key={index} style={styles.bubble}>
                          <Text style={styles.bubbleText}>💡 {item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.bubbleContainer}>
                      {expandedProfile.values?.map((item, index) => (
                        <View key={index} style={[styles.bubble, { backgroundColor: "#d4edda" }]}>
                          <Text style={styles.bubbleText}>💬 {item}</Text>
                        </View>
                      ))}
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {extraFields.map(({ key, emoji }, idx) =>
                        expandedProfile[key] ? (
                          <View key={idx} style={[styles.bubble, { backgroundColor: "#e0f7fa" }]}>
                            <Text style={styles.bubbleText}>{emoji} {expandedProfile[key]}</Text>
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.header}>Liked Your Profile!</Text>
          <Text style={styles.subheader}>
            {likedUsers.length > 0
              ? `${likedUsers.length} people have liked your profile`
              : "Here's who liked you recently"}
          </Text>

          {likedUsers.length === 0 ? (
            <Text style={styles.noLikesText}>No one has liked you yet 😔</Text>
          ) : (
            <View style={styles.gridContainer}>
              {likedUsers.map((profile) => (
                <TouchableOpacity
                  key={profile._id}
                  style={styles.gridItem}
                  onPress={() => setExpandedProfile(profile)}
                >
                  <Image source={{ uri: profile.photos?.[0] }} style={styles.avatarGrid} />
                  <Text style={styles.miniProfileName}>{profile.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={30} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send a Compliment</Text>
            <TextInput
              placeholder="Type compliment..."
              style={styles.input}
              value={compliment}
              onChangeText={setCompliment}
            />
            <TouchableOpacity style={styles.heartButton} onPress={handleSendCompliment}>
              <Heart size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContainer: { paddingBottom: 100 },
  header: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginTop: 50 },
  subheader: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 10 },
  noLikesText: { fontSize: 16, color: "#999", textAlign: "center", marginTop: 50 },
  profileContainer: { marginBottom: 40, paddingHorizontal: 16 },
  name: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  mediaBlock: { marginBottom: 20 },
  image: { width: "100%", height: 400, borderRadius: 12 },
  overlayHeart: { position: "absolute", top: 10, right: 10, backgroundColor: "white", padding: 6, borderRadius: 50, elevation: 3 },
  overlayHeartPrompt: { position: "absolute", top: 10, right: 10, backgroundColor: "white", padding: 6, borderRadius: 50, elevation: 3 },
  detailsBox: { marginTop: 10, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 },
  infoText: { fontSize: 16, marginVertical: 4 },
  bubbleContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  bubble: { backgroundColor: "#ffe5ec", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, margin: 4 },
  bubbleText: { fontSize: 14 },
  promptCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#eee", marginTop: 10, position: 'relative' },
  promptTitle: { fontSize: 18, color: "#333", fontWeight: "500", marginBottom: 15 },
  promptAnswer: { fontSize: 28, fontWeight: "900", fontFamily: "serif", lineHeight: 34 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 10 },
  heartButton: { backgroundColor: "#ff5864", padding: 15, borderRadius: 50, alignSelf: "center", marginTop: 10 },
  miniProfileBox: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  miniProfileName: { fontSize: 18, fontWeight: "bold" },
    gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "#fff0d9",
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
    },
    avatarGrid: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
    cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
    position: "relative",
  }
});
