import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowLeft, Heart, MessageCircle, X } from "lucide-react-native";
import { BottomNav } from "../../components/BottomNav";
import { ProfileInfoCard } from "../../components/ProfileInfoCard";
import { FusePopup } from "../../components/FusePopup";
import LikedYouSkeleton from "../../components/skeletons/LikedYouSkeleton";
import { API_BASE_URL } from "../config/env";

const BASE_URL = API_BASE_URL;
const SCREEN_BG = "#FFF1F2";

type LikedUser = {
  _id: string;
  name?: string;
  photos?: string[];
  status?: string;
  complimentPreview?: string | null;
  chatId?: string | null;
  twilioChannelSid?: string | null;
  dateOfBirth?: string;
  gender?: string;
  height?: string;
  interests?: string[];
  values?: string[];
  prompts?: Array<{ question?: string; answer?: string }>;
  pronouns?: string;
  sexuality?: string;
  work?: string;
  jobTitle?: string;
  college?: string;
  educationLevel?: string;
  homeTown?: string;
  religion?: string;
  zodiacSign?: string;
  politics?: string;
  ethnicity?: string;
  drinking?: string;
  smoking?: string;
  marijuana?: string;
  drugs?: string;
  datingIntentions?: string;
  relationshipType?: string;
  children?: string;
  familyPlans?: string;
  pets?: string;
  languages?: string[];
  createdAt?: string | null;
};

const calcAge = (dob?: string) => {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }
  return age > 17 && age < 100 ? age : null;
};

const sortNewestFirst = (items: LikedUser[]) =>
  [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

export default function LikedYouScreen() {
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [compliment, setCompliment] = useState("");
  const [selectedUser, setSelectedUser] = useState<LikedUser | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<LikedUser | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });
  const navigation = useNavigation();

  const showPopup = useCallback(
    (
      title: string,
      message?: string,
      tone: "default" | "success" | "error" | "info" = "default"
    ) => {
      setPopupState({ visible: true, title, message, tone });
    },
    []
  );

  const fetchLikedUsers = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        showPopup("Error", "No token found", "error");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/likes/likedyou`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch likes");
      }

      const pendingOnly = (data.users || []).filter(
        (entry: LikedUser) => entry?.status !== "accepted"
      );

      const byId = new Map<string, LikedUser>();
      for (const entry of pendingOnly) {
        const id = entry?._id?.toString?.() || entry?._id;
        if (!id) continue;

        const existing = byId.get(id);
        const preferChatEntry = Boolean(entry.chatId) && !Boolean(existing?.chatId);
        const newerEntry =
          !existing ||
          new Date(entry.createdAt || 0).getTime() >
            new Date(existing.createdAt || 0).getTime();

        if (!existing || preferChatEntry || newerEntry) {
          byId.set(id, { ...(existing || {}), ...entry, _id: id });
        }
      }

      setLikedUsers(sortNewestFirst(Array.from(byId.values())));
    } catch (error) {
      console.error("Error fetching liked users:", error);
      showPopup("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLikedUsers();
    }, [fetchLikedUsers])
  );

  const closeComplimentModal = () => {
    setModalVisible(false);
    setCompliment("");
    setSelectedUser(null);
  };

  const sendSwipeAction = async (swipedUserId: string, action: "like" | "dislike") => {
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
  };

  const handleSendCompliment = async () => {
    if (!selectedUser?._id || isSubmittingLike) return;

    const swipedUserId = selectedUser._id;
    const complimentText = compliment.trim();
    setIsSubmittingLike(true);

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) throw new Error("Missing auth token");

      let complimentResult: any = null;
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
        if (!response.ok) {
          throw new Error(complimentResult.message || "Compliment failed");
        }
      }

      const swipeResult = await sendSwipeAction(swipedUserId, "like");

      setLikedUsers((prev) => prev.filter((user) => user._id !== swipedUserId));
      if (expandedProfile?._id === swipedUserId) {
        setExpandedProfile(null);
      }
      closeComplimentModal();

      if (swipeResult?.isMatch && swipeResult?.chatId) {
        const otherUser = swipeResult.otherUser || selectedUser;
        navigation.navigate("ChatScreen" as never, {
          chatId: swipeResult.chatId,
          channelSid: swipeResult.twilioChannelSid || null,
          twilioChatChannelSid: swipeResult.twilioChannelSid || null,
          receiverId: swipedUserId,
          receiverUsername: selectedUser.name,
          actualReceiverId: swipedUserId,
          otherUser,
          chatStatus: "accepted",
          showMatchedBanner: true,
          complimentPreview: null,
        } as never);
        return;
      }

      if (complimentResult?.chatId) {
        navigation.navigate("ChatScreen" as never, {
          receiverId: swipedUserId,
          receiverUsername: selectedUser.name,
          chatId: complimentResult.chatId,
          twilioChatChannelSid:
            complimentResult.twilioChannelSid || complimentResult.chatChannelSid,
          channelSid:
            complimentResult.twilioChannelSid || complimentResult.chatChannelSid,
          chatStatus: complimentResult.status || "pending",
          complimentPreview: complimentResult.complimentPreview || complimentText,
          actualReceiverId: swipedUserId,
        } as never);
        return;
      }

      showPopup(
        complimentText ? "Compliment sent" : "Like sent",
        complimentText ? "Your message is waiting in chat." : undefined,
        "success"
      );
    } catch (error) {
      console.error("Compliment error:", error);
      showPopup("Error", "Failed to send compliment", "error");
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const handleAccept = async () => {
    if (!expandedProfile?.chatId || isProcessingRequest) return;
    setIsProcessingRequest(true);

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

      const result = await response.json().catch(() => ({}));
      if (!response.ok && result.status !== "accepted") {
        throw new Error(result.message || "Accept failed");
      }

      setLikedUsers((prev) => prev.filter((user) => user._id !== expandedProfile._id));

      navigation.navigate("ChatScreen" as never, {
        chatId: expandedProfile.chatId,
        channelSid: result.twilioChannelSid || expandedProfile.twilioChannelSid,
        twilioChatChannelSid:
          result.twilioChannelSid || expandedProfile.twilioChannelSid,
        receiverId: expandedProfile._id,
        receiverUsername: expandedProfile.name,
        actualReceiverId: expandedProfile._id,
        otherUser: result.otherUser || expandedProfile,
        chatStatus: "accepted",
        showMatchedBanner: true,
        complimentPreview: expandedProfile.complimentPreview ?? null,
      } as never);
    } catch (error) {
      console.error("Accept error:", error);
      showPopup("Error", "Failed to accept this request", "error");
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleReject = async () => {
    if (!expandedProfile?.chatId || isProcessingRequest) return;
    setIsProcessingRequest(true);

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

      const result = await response.json().catch(() => ({}));
      if (!response.ok && !["rejected", "closed"].includes(result?.status)) {
        throw new Error(result.message || "Reject failed");
      }

      setLikedUsers((prev) =>
        prev.filter(
          (user) =>
            user.chatId !== expandedProfile.chatId && user._id !== expandedProfile._id
        )
      );
      setExpandedProfile(null);
    } catch (error) {
      console.error("Reject error:", error);
      showPopup("Error", "Failed to reject this request", "error");
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const summaryText = useMemo(() => {
    if (likedUsers.length === 0) return "No new likes yet";
    if (likedUsers.length === 1) return "1 person is waiting for you";
    return `${likedUsers.length} people are waiting for you`;
  }, [likedUsers.length]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.bgOrbTop} />
        <View style={styles.bgOrbBottom} />
        <View style={styles.listScroll}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Liked You</Text>
            <Text style={styles.heroTitle}>People already interested</Text>
            <Text style={styles.heroSubtitle}>Loading the people who liked you…</Text>
          </View>
          <LikedYouSkeleton />
        </View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      {expandedProfile ? (
        <ScrollView
          contentContainerStyle={styles.detailScroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setExpandedProfile(null)} style={styles.backButton}>
            <ArrowLeft size={20} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={styles.detailHero}>
            <Image
              source={{ uri: expandedProfile.photos?.[0] }}
              style={styles.detailHeroImage}
            />
            <TouchableOpacity
              style={styles.heroHeart}
              onPress={() => {
                setSelectedUser(expandedProfile);
                setModalVisible(true);
              }}
            >
              <Heart size={20} color="#ff5864" />
            </TouchableOpacity>
            <View style={styles.heroOverlay}>
              <Text style={styles.detailName}>
                {expandedProfile.name}
                {calcAge(expandedProfile.dateOfBirth)
                  ? `, ${calcAge(expandedProfile.dateOfBirth)}`
                  : ""}
              </Text>
              <Text style={styles.detailSubtitle}>
                {expandedProfile.complimentPreview
                  ? "Sent you a compliment"
                  : "Liked your profile"}
              </Text>
            </View>
          </View>

          {expandedProfile.complimentPreview ? (
            <View style={styles.complimentCard}>
              <Text style={styles.sectionEyebrow}>Compliment</Text>
              <Text style={styles.complimentText}>
                {expandedProfile.complimentPreview}
              </Text>
            </View>
          ) : null}

          {expandedProfile.status === "pending" && expandedProfile.chatId ? (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.acceptButton, isProcessingRequest && styles.disabled]}
                onPress={handleAccept}
                disabled={isProcessingRequest}
              >
                <Text style={styles.acceptText}>
                  {isProcessingRequest ? "Working..." : "Accept"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectButton, isProcessingRequest && styles.disabled]}
                onPress={handleReject}
                disabled={isProcessingRequest}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <ProfileInfoCard
            dateOfBirth={expandedProfile.dateOfBirth}
            gender={expandedProfile.gender}
            pronouns={expandedProfile.pronouns}
            sexuality={expandedProfile.sexuality}
            height={expandedProfile.height}
            work={expandedProfile.work}
            jobTitle={expandedProfile.jobTitle}
            college={expandedProfile.college}
            educationLevel={expandedProfile.educationLevel}
            homeTown={expandedProfile.homeTown}
            religion={expandedProfile.religion}
            zodiacSign={expandedProfile.zodiacSign}
            politics={expandedProfile.politics}
            ethnicity={expandedProfile.ethnicity}
            drinking={expandedProfile.drinking}
            smoking={expandedProfile.smoking}
            marijuana={expandedProfile.marijuana}
            drugs={expandedProfile.drugs}
            datingIntentions={expandedProfile.datingIntentions}
            relationshipType={expandedProfile.relationshipType}
            children={expandedProfile.children}
            familyPlans={expandedProfile.familyPlans}
            pets={expandedProfile.pets}
            languages={expandedProfile.languages}
            interests={expandedProfile.interests}
          />

          {(expandedProfile.prompts || []).map((prompt, index) =>
            prompt?.question || prompt?.answer ? (
              <View key={`${prompt.question || "prompt"}-${index}`} style={styles.promptCard}>
                <Text style={styles.sectionEyebrow}>{prompt.question}</Text>
                <Text style={styles.promptAnswer}>{prompt.answer}</Text>
              </View>
            ) : null
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLikedUsers(true)}
              tintColor="#ff5864"
            />
          }
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Liked You</Text>
            <Text style={styles.heroTitle}>People already interested</Text>
            <Text style={styles.heroSubtitle}>{summaryText}</Text>
          </View>

          {likedUsers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptyBody}>
                When someone likes your profile or sends a compliment, they’ll show up
                here.
              </Text>
            </View>
          ) : (
            likedUsers.map((profile) => (
              <TouchableOpacity
                key={profile._id}
                style={styles.personCard}
                activeOpacity={0.92}
                onPress={() => setExpandedProfile(profile)}
              >
                <Image
                  source={{ uri: profile.photos?.[0] }}
                  style={styles.personImage}
                />
                <View style={styles.personOverlay}>
                  <View style={styles.personBadgeRow}>
                    <View style={styles.personBadge}>
                      <Text style={styles.personBadgeText}>
                        {profile.complimentPreview ? "Compliment" : "Like"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.personFooter}>
                    <View style={styles.personMeta}>
                      <Text style={styles.personName}>
                        {profile.name}
                        {calcAge(profile.dateOfBirth)
                          ? `, ${calcAge(profile.dateOfBirth)}`
                          : ""}
                      </Text>
                      <Text style={styles.personSubline} numberOfLines={1}>
                        {profile.complimentPreview
                          ? profile.complimentPreview
                          : "Tap to view profile"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        setSelectedUser(profile);
                        setModalVisible(true);
                      }}
                    >
                      <MessageCircle size={17} color="#ff5864" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              onPress={closeComplimentModal}
              style={styles.modalClose}
              disabled={isSubmittingLike}
            >
              <X size={20} color="#1a1a1a" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Send a like</Text>
            <Text style={styles.modalSubtitle}>
              Add a comment if you want to stand out.
            </Text>

            <TextInput
              placeholder="Add a comment"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={compliment}
              onChangeText={setCompliment}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendButton, isSubmittingLike && styles.disabled]}
              onPress={handleSendCompliment}
              disabled={isSubmittingLike}
            >
              <Heart size={18} color="#ffffff" fill="#ffffff" />
              <Text style={styles.sendButtonText}>
                {isSubmittingLike ? "Sending..." : "Send Like"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <FusePopup
        visible={popupState.visible}
        title={popupState.title}
        message={popupState.message}
        tone={popupState.tone}
        onClose={() => setPopupState((prev) => ({ ...prev, visible: false }))}
      />

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  bgOrbTop: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FFE4E8",
    top: -72,
    right: -58,
  },
  bgOrbBottom: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFF5F5",
    bottom: 68,
    left: -60,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SCREEN_BG,
  },
  listScroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 42,
    paddingBottom: 98,
  },
  detailScroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 58 : 40,
    paddingBottom: 98,
    gap: 12,
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F8DDE1",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroEyebrow: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins",
    lineHeight: 21,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  emptyTitle: {
    fontSize: 20,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  personCard: {
    height: 250,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F5D7DB",
  },
  personImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  personOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(26,26,26,0.18)",
  },
  personBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  personBadge: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  personBadgeText: {
    color: "#ff5864",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  personFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  personMeta: {
    flex: 1,
    marginRight: 12,
  },
  personName: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    lineHeight: 32,
  },
  personSubline: {
    marginTop: 4,
    color: "#FDECEC",
    fontSize: 13,
    fontFamily: "Poppins",
  },
  replyButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 10,
  },
  detailHero: {
    height: 430,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    position: "relative",
    marginBottom: 12,
  },
  detailHeroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  heroHeart: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "rgba(17,24,39,0.24)",
  },
  detailName: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 34,
    fontFamily: "Poppins-Bold",
  },
  detailSubtitle: {
    marginTop: 6,
    color: "#FDECEC",
    fontSize: 14,
    fontFamily: "Poppins",
  },
  complimentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionEyebrow: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 10,
  },
  complimentText: {
    color: "#1a1a1a",
    fontSize: 18,
    lineHeight: 28,
    fontFamily: "Poppins-Bold",
  },
  requestActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  acceptButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff5864",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
  rejectButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rejectText: {
    color: "#6B7280",
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
  },
  disabled: {
    opacity: 0.6,
  },
  promptCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  promptAnswer: {
    color: "#1a1a1a",
    fontSize: 22,
    lineHeight: 30,
    fontFamily: "Poppins-Bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
  },
  modalClose: {
    alignSelf: "flex-end",
  },
  modalTitle: {
    color: "#1a1a1a",
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    marginTop: 4,
  },
  modalSubtitle: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  input: {
    marginTop: 16,
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#1a1a1a",
    fontSize: 15,
    fontFamily: "Poppins",
    textAlignVertical: "top",
  },
  sendButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ff5864",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Poppins-Bold",
  },
});
