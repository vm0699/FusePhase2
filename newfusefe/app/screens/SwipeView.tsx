import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Animated,
  ScrollView,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { X, Heart, SlidersHorizontal } from "lucide-react-native";
import { BottomNav } from "../../components/BottomNav";
import { ProfileInfoCard } from "../../components/ProfileInfoCard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const BASE_URL = "http://172.20.10.4:5000";

export default function SwipeView() {
  const navigation = useNavigation();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const hasFetchedOnceRef = React.useRef(false);

  const [compliment, setCompliment] = useState("");
  const [isComplimentPopupOpen, setIsComplimentPopupOpen] = useState(false);
  const [isSendingCompliment, setIsSendingCompliment] = useState(false);
  const [isSendingAction, setIsSendingAction] = useState(false);
  // Tracks which individual heart is in liked/filled state
  const [likedKey, setLikedKey] = useState<string | null>(null);
  // Tracks the actual content (photo URL or prompt object) being liked
  const [likedContent, setLikedContent] = useState<any>(null);
  // Per-heart bloom animation refs keyed by 'photo-{i}' or 'prompt-{i}'
  const heartScaleRefs = React.useRef<Record<string, Animated.Value>>({});

  // Animations for the compliment popup (Hinge-style centered card)
  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.9)).current;

  const getHeartScale = (key: string): Animated.Value => {
    if (!heartScaleRefs.current[key]) {
      heartScaleRefs.current[key] = new Animated.Value(1);
    }
    return heartScaleRefs.current[key];
  };

  const swipeAnimation = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedOnceRef.current) {
        hasFetchedOnceRef.current = true;
        fetchProfiles();
      }
    }, [])
  );

  const advanceToNextProfile = () => setCurrentProfileIndex((p) => p + 1);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const userId = await AsyncStorage.getItem("userId");
      if (!token) return;

      let filters = null;
      if (userId) {
        const stored = await AsyncStorage.getItem(`filters:${userId}`);
        if (stored) {
          try { filters = JSON.parse(stored); } catch { }
        }
      }

      const response = await fetch(`${BASE_URL}/api/profile/filteredProfiles`, {
        method: filters ? "POST" : "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: filters ? JSON.stringify({ filters }) : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Fetch failed");
      setProfiles(result.profiles || []);
      setCurrentProfileIndex(0);
    } catch (e) {
      console.error("❌ fetchProfiles:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchProfiles(); };

  const sendSwipeAction = async (swipedUserId, action) => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) return;
    await fetch(`${BASE_URL}/api/profile/swipe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ swipedUserId, action }),
    });
  };

  const sendComplimentRequest = async (swipedUserId, complimentText) => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) throw new Error("Missing auth token");
    const response = await fetch(`${BASE_URL}/api/chat/send-compliment`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ swipedUserId, compliment: complimentText || "" }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Compliment failed");
    return result;
  };

  const recordLikeOnce = async (swipedUserId) => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) return null;
    const response = await fetch(`${BASE_URL}/api/profile/swipe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ swipedUserId, action: "like" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Failed to record like");
    return result;
  };

  const openComplimentModal = (key: string, content: any) => {
    if (isSendingAction || isSendingCompliment) return;
    setLikedKey(key);
    setLikedContent(content);

    const scale = getHeartScale(key);
    // Bloom: scale up smoothly then spring back
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.4,
        useNativeDriver: true,
        friction: 6,
        tension: 110,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 100,
      }),
    ]).start();

    // Fade in and scale up the modal card
    setIsComplimentPopupOpen(true);
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeComplimentModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsComplimentPopupOpen(false);
      setLikedKey(null);
      setLikedContent(null);
      setCompliment("");
    });
  };

  const handleSwipe = async (direction) => {
    if (!profiles.length || currentProfileIndex >= profiles.length || isSendingAction || isSendingCompliment) return;
    const swipedUserId = profiles[currentProfileIndex]?._id;
    Animated.timing(swipeAnimation, {
      toValue: direction === "right" ? 300 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      swipeAnimation.setValue(0);
      if (direction === "right") {
        // Default to liking the first photo if they just swipe the whole card
        const firstPhoto = profile?.photos?.[0];
        openComplimentModal('photo-0', { type: 'photo', url: firstPhoto });
      } else {
        (async () => {
          try {
            setIsSendingAction(true);
            await sendSwipeAction(swipedUserId, "dislike");
            advanceToNextProfile();
          } catch {
            Alert.alert("Error", "Failed to record dislike.");
          } finally {
            setIsSendingAction(false);
          }
        })();
      }
    });
  };

  const handleSendCompliment = async () => {
    const swipedUserId = profiles[currentProfileIndex]?._id;
    if (!swipedUserId || currentProfileIndex >= profiles.length || isSendingAction || isSendingCompliment) return;
    const complimentText = compliment.trim();
    setIsSendingCompliment(true);
    setIsSendingAction(true);
    try {
      let swipeResult = null;
      if (complimentText) {
        await sendComplimentRequest(swipedUserId, complimentText);
        swipeResult = await recordLikeOnce(swipedUserId);
      } else {
        swipeResult = await recordLikeOnce(swipedUserId);
      }
      setIsComplimentPopupOpen(false);
      setCompliment("");
      setLikedKey(null);
      setLikedContent(null);
      advanceToNextProfile();
      if (swipeResult?.isMatch && swipeResult?.chatId) {
        const otherUser = swipeResult.otherUser || {};
        (navigation as any).navigate("ChatScreen", {
          chatId: swipeResult.chatId,
          channelSid: swipeResult.twilioChannelSid || null,
          twilioChatChannelSid: swipeResult.twilioChannelSid || null,
          receiverId: otherUser._id,
          actualReceiverId: otherUser._id,
          receiverUsername: otherUser.name,
          otherUser,
          chatStatus: "accepted",
          showMatchedBanner: true,
          complimentPreview: complimentText || null,
        });
      } else {
        Alert.alert(complimentText ? "Compliment sent!" : "Like sent", complimentText ? "Chat created." : "They'll see you in their Liked You.");
      }
    } catch (e) {
      console.error("❌ handleSendCompliment:", e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsSendingCompliment(false);
      setIsSendingAction(false);
    }
  };

  const hasProfiles = profiles.length > 0;
  const profileInRange = hasProfiles && currentProfileIndex < profiles.length;
  const profile = profileInRange ? profiles[currentProfileIndex] : null;
  const isCaughtUp = hasProfiles && !profileInRange;

  React.useEffect(() => {
    if (isCaughtUp) hasFetchedOnceRef.current = false;
  }, [isCaughtUp]);

  // Only show fields that have values — no emojis, clean text
  const infoFields = [
    profile?.gender,
    profile?.height,
    profile?.dateOfBirth,
  ].filter(Boolean);

  const tags = [
    ...(profile?.interests || []),
    ...(profile?.values || []),
    ...(profile?.college ? [profile.college] : []),
    ...(profile?.work ? [profile.work] : []),
    ...(profile?.zodiacSign ? [profile.zodiacSign] : []),
    ...(profile?.religion ? [profile.religion] : []),
    ...(profile?.languages ? [profile.languages] : []),
    ...(profile?.pets ? [profile.pets] : []),
    ...(profile?.drinking ? [profile.drinking] : []),
    ...(profile?.smoking ? [profile.smoking] : []),
    ...(profile?.ethnicity ? [profile.ethnicity] : []),
    ...(profile?.politics ? [profile.politics] : []),
  ].filter(Boolean);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff5864" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>Fuse</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("FilterScreen")}
        >
          <SlidersHorizontal size={20} color="#1a1a1a" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {profile ? (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff5864" />
          }
        >
          {profile.photos.map((photo, i) => (
            <View key={i} style={styles.card}>

              {/* PHOTO */}
              <View style={styles.photoBox}>
                <Image source={{ uri: photo }} style={styles.photo} />

                {/* Name + age: only on first photo */}
                {i === 0 && (
                  <View style={styles.nameOverlay}>
                    <Text style={styles.nameText}>
                      {profile.name}{profile.age ? `,  ${profile.age}` : ""}
                    </Text>
                  </View>
                )}

                {/* Heart — white circle, no border, app-color outline */}
                {(() => {
                  const hKey = `photo-${i}`;
                  const scale = getHeartScale(hKey);
                  const liked = likedKey === hKey;
                  return (
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => openComplimentModal(hKey, { type: 'photo', url: photo })}
                      activeOpacity={0.85}
                    >
                      <Animated.View style={{ transform: [{ scale }] }}>
                        <Heart
                          size={22}
                          color="#ff5864"
                          fill={liked ? "#ff5864" : "white"}
                          strokeWidth={2}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })()}
              </View>

              {/* PROFILE INFO CARD — shown only on first photo */}
              {i === 0 && profile.prompts[0] && (
                <View style={styles.promptCard}>
                  {(() => {
                    const hKey = "prompt-0";
                    const scale = getHeartScale(hKey);
                    const liked = likedKey === hKey;
                    const promptObj = profile.prompts[0];
                    return (
                      <TouchableOpacity
                        style={styles.promptHeartBtn}
                        onPress={() => openComplimentModal(hKey, { type: "prompt", ...promptObj })}
                        activeOpacity={0.85}
                      >
                        <Animated.View style={{ transform: [{ scale }] }}>
                          <Heart
                            size={21}
                            color="#ff5864"
                            fill={liked ? "#ff5864" : "white"}
                            strokeWidth={2}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })()}
                  <Text style={[styles.promptQ, { paddingRight: 52 }]}>
                    {profile.prompts[0].question}
                  </Text>
                  <Text style={styles.promptA}>{profile.prompts[0].answer}</Text>
                </View>
              )}

              {i === 0 && (
                <View style={styles.infoCardWrapper}>
                  <ProfileInfoCard
                    dateOfBirth={profile.dateOfBirth}
                    gender={profile.gender}
                    pronouns={profile.pronouns}
                    sexuality={profile.sexuality}
                    height={profile.height}
                    work={profile.work}
                    jobTitle={profile.jobTitle}
                    college={profile.college}
                    educationLevel={profile.educationLevel}
                    lives_in={profile.lives_in}
                    homeTown={profile.homeTown}
                    religion={profile.religion}
                    zodiacSign={profile.zodiacSign}
                    politics={profile.politics}
                    ethnicity={profile.ethnicity}
                    drinking={profile.drinking}
                    smoking={profile.smoking}
                    marijuana={profile.marijuana}
                    drugs={profile.drugs}
                    datingIntentions={profile.datingIntentions}
                    relationshipType={profile.relationshipType}
                    children={profile.children}
                    familyPlans={profile.familyPlans}
                    pets={profile.pets}
                    languages={profile.languages}
                    interests={profile.interests}
                  />
                </View>
              )}

              {/* PROMPT CARD */}
              {i !== 0 && profile.prompts[i] && (
                <View style={styles.promptCard}>
                  {/* Prompt heart — top right, per-item state */}
                  {(() => {
                    const hKey = `prompt-${i}`;
                    const scale = getHeartScale(hKey);
                    const liked = likedKey === hKey;
                    const promptObj = profile.prompts[i];
                    return (
                      <TouchableOpacity
                        style={styles.promptHeartBtn}
                        onPress={() => openComplimentModal(hKey, { type: 'prompt', ...promptObj })}
                        activeOpacity={0.85}
                      >
                        <Animated.View style={{ transform: [{ scale }] }}>
                          <Heart
                            size={21}
                            color="#ff5864"
                            fill={liked ? "#ff5864" : "white"}
                            strokeWidth={2}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })()}
                  <Text style={[styles.promptQ, { paddingRight: 52 }]}>{profile.prompts[i].question}</Text>
                  <Text style={styles.promptA}>{profile.prompts[i].answer}</Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>
            {isCaughtUp ? "All caught up" : "No profiles"}
          </Text>
          <Text style={styles.emptyBody}>
            {isCaughtUp ? "Pull to refresh for more" : "Try adjusting your filters"}
          </Text>
        </View>
      )}

      <Modal visible={isComplimentPopupOpen} transparent animationType="none">
        <Animated.View style={[styles.backdrop, { opacity: modalOpacity }]}>
          <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />

          <Animated.View
            style={[
              styles.hingeFloatingCard,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <Text style={styles.hingeProfileName}>{profile?.name}</Text>

            <View style={[
              styles.hingeContextCard,
              likedContent?.type === 'prompt' && styles.hingePromptOnlyCard
            ]}>
              {likedContent?.type === 'photo' ? (
                <Image
                  source={{ uri: likedContent.url }}
                  style={styles.hingeContentPhotoFull}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.hingePromptCleanBox}>
                  <Text style={styles.hingePromptQ_Dark}>{likedContent?.question}</Text>
                  <Text style={styles.hingePromptA_Dark}>{likedContent?.answer}</Text>
                </View>
              )}
            </View>

            <TextInput
              placeholder="Add a comment"
              placeholderTextColor="#A1A1A1"
              style={styles.hingeCommentInput}
              value={compliment}
              onChangeText={setCompliment}
              multiline
              autoFocus
            />

            <View style={styles.hingeActionRow}>
              <TouchableOpacity
                style={styles.hingeSendLikeBtn}
                onPress={handleSendCompliment}
              >
                <Text style={styles.hingeSendLikeText}>Send Like</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={closeComplimentModal} style={styles.hingeCancelBtn}>
              <Text style={styles.hingeCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* SENDING OVERLAY */}
      <Modal visible={isSendingCompliment} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      </Modal>

      {/* DISLIKE BUTTON */}
      {profile && (
        <TouchableOpacity style={styles.crossBtn} onPress={() => handleSwipe("left")}>
          <X size={24} color="#ff5864" strokeWidth={2} />
        </TouchableOpacity>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F3",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F3",
  },

  // TOP BAR
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 10,
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    letterSpacing: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },

  // SCROLL
  scroll: { flex: 1, paddingHorizontal: 16 },
  card: { marginBottom: 12 },

  // PHOTO
  photoBox: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  photo: { width: "100%", height: 460 },
  nameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  nameText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
  },
  heartBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  heartBtnActive: {},

  // PROFILE INFO CARD WRAPPER
  infoCardWrapper: {
    marginTop: 8,
  },

  // PROMPT CARD
  promptCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    position: "relative",
  },
  promptQ: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 10,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  promptA: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    lineHeight: 30,
    paddingRight: 36,
  },
  promptHeartBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // EMPTY
  emptyTitle: {
    fontSize: 24,
    fontWeight: "300",
    color: "#1a1a1a",
    fontFamily: "Poppins",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: "#9ca3af",
  },

  // HINGE-STYLE FLOATING CARD LIKE OVERLAY
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker dimmed backdrop
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  hingeFloatingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: "100%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
  },
  hingeProfileName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 20,
  },
  hingeContextCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    width: "100%",
    aspectRatio: 1,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  hingePromptOnlyCard: {
    aspectRatio: undefined,
    minHeight: 100,
  },
  hingeContentPhotoFull: {
    width: '100%',
    height: '100%',
  },
  hingePromptCleanBox: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    width: '100%',
  },
  hingePromptQ_Dark: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 6,
  },
  hingePromptA_Dark: {
    fontSize: 18,
    color: "#1a1a1a",
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
    lineHeight: 26,
  },
  hingeCommentInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1a1a",
    width: "100%",
    minHeight: 54,
    marginBottom: 20,
  },
  hingeActionRow: {
    width: '100%',
    marginBottom: 16,
  },
  hingeSendLikeBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FAF2F2", // Very subtle peach/rose
    alignItems: "center",
    justifyContent: "center",
  },
  hingeSendLikeText: {
    color: "#ff5864",
    fontSize: 17,
    fontWeight: "700",
  },
  hingeCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  hingeCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },

  // LOADER
  loaderOverlay: {
    flex: 1,
    backgroundColor: "rgba(250,248,243,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  // DISLIKE BUTTON
  crossBtn: {
    position: "absolute",
    bottom: 90,
    left: 22,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
});
