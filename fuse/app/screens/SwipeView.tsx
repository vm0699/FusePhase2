import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  ScrollView,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { X, Heart, SlidersHorizontal, Search, RefreshCw } from "lucide-react-native";
import { BottomNav } from "../../components/BottomNav";
import { ProfileInfoCard } from "../../components/ProfileInfoCard";
import { FusePopup } from "../../components/FusePopup";
import { EmptyState } from "../../components/ui";
import HeaderAvatar from "../../components/ui/HeaderAvatar";
import SwipeCardSkeleton from "../../components/skeletons/SwipeCardSkeleton";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "../config/env";

const BASE_URL = API_BASE_URL;
const DISCOVERY_PAGE_SIZE = 8;
const PREFETCH_THRESHOLD = 3;
const DISCOVERY_SESSION_STORAGE_PREFIX = "swipeDiscoverySession:";
const SWIPE_BG_COLOR = "#FFF1F2";
const FILTERS_APPLIED_NOTICE_KEY = "filtersAppliedNoticePending";

type DiscoveryFilters = {
  ageRange?: { min: number; max: number };
  ageFlex?: boolean;
  distanceKm?: number;
  distanceFlex?: boolean;
  interests?: string[];
  datingIntentions?: string[];
  religion?: string[];
  ethnicity?: string[];
  drinking?: string[];
  smoking?: string[];
  activeOnly?: boolean;
  eventScope?: "EVERYONE" | "EVENT_GOERS" | "MY_CIRCLES";
} | null;

type DiscoveryProfile = {
  _id: string;
  name?: string;
  age?: number;
  photos?: string[];
  prompts?: Array<{ question?: string; answer?: string }>;
  interests?: string[];
  values?: string[];
  gender?: string;
  height?: string;
  dateOfBirth?: string;
  pronouns?: string;
  sexuality?: string;
  work?: string;
  jobTitle?: string;
  college?: string;
  educationLevel?: string;
  lives_in?: string;
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
  // Discovery metadata from backend
  activityLabel?: string | null;
  distanceKm?: number | null;
  sharedInterestCount?: number;
  sharedEventTitle?: string | null;
};

type DiscoverySession = {
  filtersKey: string;
  profiles: DiscoveryProfile[];
  currentProfileIndex: number;
  lastCursor: string | null;
  hasMoreProfiles: boolean;
  recycledDeck: boolean;
};

export default function SwipeView() {
  const navigation = useNavigation();

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true);
  const [recycledDeck, setRecycledDeck] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const hasFetchedOnceRef = React.useRef(false);
  const lastCursorRef = React.useRef<string | null>(null);
  const activeFiltersKeyRef = React.useRef("default");
  const discoverySessionKeyRef = React.useRef<string | null>(null);
  const requestInFlightRef = React.useRef(false);
  const deckResetInFlightRef = React.useRef(false);
  const swipeActionLockRef = React.useRef<string | null>(null);

  const [compliment, setCompliment] = useState("");
  const [isComplimentPopupOpen, setIsComplimentPopupOpen] = useState(false);
  const [isSendingCompliment, setIsSendingCompliment] = useState(false);
  const [isSendingAction, setIsSendingAction] = useState(false);
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });
  const [likedKey, setLikedKey] = useState<string | null>(null);
  const [likedContent, setLikedContent] = useState<any>(null);
  const heartScaleRefs = React.useRef<Record<string, Animated.Value>>({});

  const modalOpacity = React.useRef(new Animated.Value(0)).current;
  const modalScale = React.useRef(new Animated.Value(0.9)).current;

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

  const getHeartScale = (key: string): Animated.Value => {
    if (!heartScaleRefs.current[key]) {
      heartScaleRefs.current[key] = new Animated.Value(1);
    }
    return heartScaleRefs.current[key];
  };

  const swipeAnimation = React.useRef(new Animated.Value(0)).current;

  const advanceToNextProfile = () => setCurrentProfileIndex((p) => p + 1);

  const loadDiscoveryContext = async () => {
    const token = await AsyncStorage.getItem("jwtToken");
    const userId = await AsyncStorage.getItem("userId");

    let filters: DiscoveryFilters = null;
    if (userId) {
      const stored = await AsyncStorage.getItem("filters:" + userId);
      if (stored) {
        try {
          filters = JSON.parse(stored);
        } catch {}
      }
    }

    return {
      token,
      userId,
      filters,
      filtersKey: userId ? JSON.stringify(filters || null) : "default",
      sessionStorageKey: userId
        ? DISCOVERY_SESSION_STORAGE_PREFIX + userId
        : null,
    };
  };

  const persistDiscoverySession = async (session: DiscoverySession) => {
    if (!discoverySessionKeyRef.current) return;

    try {
      await AsyncStorage.setItem(
        discoverySessionKeyRef.current,
        JSON.stringify(session)
      );
    } catch (error) {
      console.error("persistDiscoverySession:", error);
    }
  };

  const clearPersistedDiscoverySession = async () => {
    if (!discoverySessionKeyRef.current) return;

    try {
      await AsyncStorage.removeItem(discoverySessionKeyRef.current);
    } catch (error) {
      console.error("clearPersistedDiscoverySession:", error);
    }
  };

  const restoreDiscoverySession = async ({
    filtersKey,
    sessionStorageKey,
  }: {
    filtersKey: string;
    sessionStorageKey: string | null;
  }) => {
    if (!sessionStorageKey) return false;

    try {
      const stored = await AsyncStorage.getItem(sessionStorageKey);
      if (!stored) return false;

      const parsed: DiscoverySession = JSON.parse(stored);
      if (!parsed || parsed.filtersKey !== filtersKey) {
        await AsyncStorage.removeItem(sessionStorageKey);
        return false;
      }

      const safeProfiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
      const maxIndex = safeProfiles.length ? safeProfiles.length - 1 : 0;
      const safeIndex = Math.max(
        0,
        Math.min(parsed.currentProfileIndex || 0, maxIndex)
      );

      activeFiltersKeyRef.current = filtersKey;
      lastCursorRef.current = parsed.lastCursor || null;
      setProfiles(safeProfiles);
      setCurrentProfileIndex(safeIndex);
      setHasMoreProfiles(Boolean(parsed.hasMoreProfiles));
      setRecycledDeck(Boolean(parsed.recycledDeck));
      setLoading(false);
      setRefreshing(false);
      setIsFetchingMore(false);

      return safeProfiles.length > 0;
    } catch (error) {
      console.error("restoreDiscoverySession:", error);
      try {
        await AsyncStorage.removeItem(sessionStorageKey);
      } catch {}
      return false;
    }
  };

  const fetchProfilesPage = async ({
    cursor = null,
    reset = false,
    showLoader = false,
    forceRebuild = false,
  }: {
    cursor?: string | null;
    reset?: boolean;
    showLoader?: boolean;
    forceRebuild?: boolean;
  }) => {
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    if (showLoader) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const { token, filters, filtersKey, sessionStorageKey } =
        await loadDiscoveryContext();
      if (!token) return;

      discoverySessionKeyRef.current = sessionStorageKey;

      const response = await fetch(BASE_URL + "/api/profile/filteredProfiles", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters,
          cursor: reset ? null : cursor,
          limit: DISCOVERY_PAGE_SIZE,
          ...(forceRebuild && { forceRebuild: true }),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Fetch failed");

      const incomingProfiles: DiscoveryProfile[] = Array.isArray(result.profiles)
        ? result.profiles
        : [];
      const pagination = result.pagination || {};

      activeFiltersKeyRef.current = filtersKey;
      lastCursorRef.current = pagination.nextCursor || null;
      setHasMoreProfiles(Boolean(pagination.hasMore));
      setRecycledDeck(Boolean(pagination.recycled));

      setProfiles((prev) => {
        if (reset) {
          return incomingProfiles;
        }

        const seen = new Set(prev.map((item) => item._id));
        const merged = [...prev];
        for (const item of incomingProfiles) {
          if (!item?._id || seen.has(item._id)) continue;
          seen.add(item._id);
          merged.push(item);
        }
        return merged;
      });

      if (reset) {
        setCurrentProfileIndex(0);
      }
    } catch (e) {
      console.error("fetchProfiles:", e);
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setIsFetchingMore(false);
      deckResetInFlightRef.current = false;
    }
  };

  const resetAndFetchProfiles = async ({
    showLoader = false,
    refreshingState = false,
    forceRebuild = false,
  }: {
    showLoader?: boolean;
    refreshingState?: boolean;
    forceRebuild?: boolean;
  } = {}) => {
    if (deckResetInFlightRef.current) return;

    deckResetInFlightRef.current = true;
    if (refreshingState) {
      setRefreshing(true);
    }
    setHasMoreProfiles(true);
    setRecycledDeck(false);
    lastCursorRef.current = null;

    await fetchProfilesPage({
      cursor: null,
      reset: true,
      showLoader,
      forceRebuild,
    });
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const { filtersKey, sessionStorageKey } = await loadDiscoveryContext();
        if (!isActive) return;

        discoverySessionKeyRef.current = sessionStorageKey;

        if (!hasFetchedOnceRef.current) {
          hasFetchedOnceRef.current = true;
          const restored = await restoreDiscoverySession({
            filtersKey,
            sessionStorageKey,
          });
          if (restored) {
            activeFiltersKeyRef.current = filtersKey;
            return;
          }
          await resetAndFetchProfiles({ showLoader: true });
          return;
        }

        if (activeFiltersKeyRef.current !== filtersKey) {
          await resetAndFetchProfiles({ showLoader: true });
        }

        const pendingFiltersNotice = await AsyncStorage.getItem(
          FILTERS_APPLIED_NOTICE_KEY
        );
        if (pendingFiltersNotice === "1" && isActive) {
          await AsyncStorage.removeItem(FILTERS_APPLIED_NOTICE_KEY);
          showPopup(
            "Filters applied",
            "We’ll prioritize your selected preferences. If matches run low, discovery may gently widen results so you still see people.",
            "info"
          );
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  React.useEffect(() => {
    const remainingProfiles = profiles.length - currentProfileIndex;

    if (
      loading ||
      refreshing ||
      isFetchingMore ||
      !hasMoreProfiles ||
      currentProfileIndex >= profiles.length ||
      remainingProfiles > PREFETCH_THRESHOLD
    ) {
      return;
    }

    fetchProfilesPage({ cursor: lastCursorRef.current });
  }, [currentProfileIndex, hasMoreProfiles, isFetchingMore, loading, profiles.length, refreshing]);

  React.useEffect(() => {
    if (
      loading ||
      refreshing ||
      isFetchingMore ||
      deckResetInFlightRef.current ||
      currentProfileIndex < profiles.length ||
      profiles.length === 0
    ) {
      return;
    }

    resetAndFetchProfiles();
  }, [currentProfileIndex, isFetchingMore, loading, profiles.length, refreshing]);

  React.useEffect(() => {
    if (!hasFetchedOnceRef.current || loading || !activeFiltersKeyRef.current) {
      return;
    }

    if (!profiles.length) {
      clearPersistedDiscoverySession();
      return;
    }

    persistDiscoverySession({
      filtersKey: activeFiltersKeyRef.current,
      profiles,
      currentProfileIndex,
      lastCursor: lastCursorRef.current,
      hasMoreProfiles,
      recycledDeck,
    });
  }, [currentProfileIndex, hasMoreProfiles, loading, profiles, recycledDeck]);

  const onRefresh = () => {
    resetAndFetchProfiles({ refreshingState: true, forceRebuild: true });
  };

  const sendSwipeAction = async (swipedUserId, action) => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) return;
    const response = await fetch(`${BASE_URL}/api/profile/swipe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ swipedUserId, action }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Failed to record swipe");
    return result;
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
    if (!swipedUserId || swipeActionLockRef.current === swipedUserId) return;
    swipeActionLockRef.current = swipedUserId;
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
        swipeActionLockRef.current = null;
      } else {
        (async () => {
          try {
            setIsSendingAction(true);
            await sendSwipeAction(swipedUserId, "dislike");
            advanceToNextProfile();
          } catch {
            showPopup("Error", "Failed to record dislike.", "error");
          } finally {
            setIsSendingAction(false);
            if (swipeActionLockRef.current === swipedUserId) {
              swipeActionLockRef.current = null;
            }
          }
        })();
      }
    });
  };

  const handleSendCompliment = async () => {
    const swipedUserId = profiles[currentProfileIndex]?._id;
    if (!swipedUserId || currentProfileIndex >= profiles.length || isSendingAction || isSendingCompliment) return;
    if (swipeActionLockRef.current === swipedUserId) return;
    swipeActionLockRef.current = swipedUserId;
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
        showPopup(
          complimentText ? "Compliment sent" : "Like sent",
          complimentText
            ? "Chat created."
            : "They will see you in their Liked You.",
          "success"
        );
      }
    } catch (e) {
      console.error("❌ handleSendCompliment:", e);
      showPopup("Error", "Something went wrong.", "error");
    } finally {
      setIsSendingCompliment(false);
      setIsSendingAction(false);
      if (swipeActionLockRef.current === swipedUserId) {
        swipeActionLockRef.current = null;
      }
    }
  };

  const hasProfiles = profiles.length > 0;
  const profileInRange = hasProfiles && currentProfileIndex < profiles.length;
  const profile = profileInRange ? profiles[currentProfileIndex] : null;

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
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <HeaderAvatar size={34} />
            <Text style={styles.brand}>Fuse</Text>
          </View>
          <View style={styles.iconBtn}>
            <SlidersHorizontal size={20} color="#1a1a1a" strokeWidth={1.8} />
          </View>
        </View>
        <SwipeCardSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <HeaderAvatar size={34} />
          <Text style={styles.brand}>Fuse</Text>
        </View>
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
          {(profile.photos || []).map((photo, i) => (
            <View key={i} style={styles.card}>

              {/* PHOTO */}
              <View style={styles.photoBox}>
                <Image source={{ uri: photo }} style={styles.photo} />

                {/* Name + age + activity badge: only on first photo */}
                {i === 0 && (
                  <View style={styles.nameOverlay}>
                    <Text style={styles.nameText}>
                      {profile.name}{profile.age ? `,  ${profile.age}` : ""}
                    </Text>
                    {profile.activityLabel ? (
                      <View style={styles.activityBadge}>
                        <Text style={styles.activityBadgeText}>
                          Active {profile.activityLabel}
                        </Text>
                      </View>
                    ) : null}
                    {profile.sharedEventTitle ? (
                      <View style={styles.eventBadge}>
                        <Text style={styles.eventBadgeText}>
                          You were both at {profile.sharedEventTitle}
                        </Text>
                      </View>
                    ) : null}
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
              {i === 0 && profile.prompts?.[0] && (
                <View style={styles.promptCard}>
                  {(() => {
                    const hKey = "prompt-0";
                    const scale = getHeartScale(hKey);
                    const liked = likedKey === hKey;
                    const promptObj = profile.prompts?.[0];
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
                    {profile.prompts?.[0]?.question}
                  </Text>
                  <Text style={styles.promptA}>{profile.prompts?.[0]?.answer}</Text>
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
              {i !== 0 && profile.prompts?.[i] && (
                <View style={styles.promptCard}>
                  {/* Prompt heart — top right, per-item state */}
                  {(() => {
                    const hKey = `prompt-${i}`;
                    const scale = getHeartScale(hKey);
                    const liked = likedKey === hKey;
                    const promptObj = profile.prompts?.[i];
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
                  <Text style={[styles.promptQ, { paddingRight: 52 }]}>{profile.prompts?.[i]?.question}</Text>
                  <Text style={styles.promptA}>{profile.prompts?.[i]?.answer}</Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          {isFetchingMore ? (
            <>
              <ActivityIndicator size="large" color="#ff5864" />
              <Text style={styles.emptyTitle}>Loading more profiles</Text>
              <Text style={styles.emptyBody}>
                {recycledDeck
                  ? "Refreshing your deck from earlier swipes."
                  : "Pulling the next batch for you."}
              </Text>
            </>
          ) : (
            <EmptyState
              icon={recycledDeck ? RefreshCw : Search}
              title={recycledDeck ? "Your deck has refreshed" : "No profiles nearby"}
              message={
                recycledDeck
                  ? "Previously swiped profiles are back in rotation."
                  : "Try widening your distance, age range, or interests to see more people."
              }
              ctaLabel={recycledDeck ? undefined : "Adjust filters"}
              onCtaPress={
                recycledDeck ? undefined : () => navigation.navigate("FilterScreen")
              }
            />
          )}
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
      <FusePopup
        visible={popupState.visible}
        title={popupState.title}
        message={popupState.message}
        tone={popupState.tone}
        onClose={() => setPopupState((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SWIPE_BG_COLOR,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: SWIPE_BG_COLOR,
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
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  activityBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  activityBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  eventBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(124,58,237,0.55)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  eventBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.2,
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
    bottom: 110,
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
