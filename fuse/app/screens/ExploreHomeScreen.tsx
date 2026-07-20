import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gift, Coffee, Ticket, Crown, Sparkles, ChevronLeft, Users } from "lucide-react-native";

import { theme } from "../theme";
import exploreApi, { type ExploreHome, type ExploreMode } from "../api/exploreApi";
import LocationChip from "../../components/ui/explore/LocationChip";
import HeroCarousel from "../../components/ui/explore/HeroCarousel";
import CategoryStrip, { SOCIAL_CATEGORIES } from "../../components/ui/explore/CategoryStrip";
import ExploreModeToggle from "../../components/ui/explore/ExploreModeToggle";
import SectionRail from "../../components/ui/explore/SectionRail";
import VenueCard from "../../components/ui/explore/VenueCard";
import EventCard from "../../components/ui/explore/EventCard";
import GiftCard from "../../components/ui/explore/GiftCard";
import HeaderAvatar from "../../components/ui/HeaderAvatar";
import { Skeleton } from "../../components/ui";
import { FusePopup } from "../../components/FusePopup";

const DATE_HERO_SLIDES = [
  {
    id: "dates",
    title: "Plan a real date 🍵",
    subtitle: "Book curated Chennai cafés & restaurants",
    bgColor: "#ff5864",
  },
  {
    id: "gifts",
    title: "Send a thoughtful gift",
    subtitle: "Safe, platform-approved gifts from ₹199",
    bgColor: "#059669",
  },
];

const PEOPLE_HERO_SLIDES = [
  {
    id: "meetpeople",
    title: "Never go out alone 🎉",
    subtitle: "Run clubs, house parties & meetups happening in Chennai",
    bgColor: "#7C3AED",
  },
];

export default function ExploreHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ExploreMode>("dates");
  const [modeReady, setModeReady] = useState(false);
  const homeByMode = useRef<Record<ExploreMode, ExploreHome | null>>({ dates: null, people: null });
  const [home, setHome] = useState<ExploreHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGiftExplainer, setShowGiftExplainer] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Gifting is per-conversation (it requires a specific chat + recipient for
  // eligibility, pricing, and delivery), so there's no generic "browse gifts"
  // entry point here — every Explore gift tap routes through this instead of
  // navigating to GiftCatalog/GiftItemDetail with no chatId (which silently
  // can't complete a purchase).
  const handleGiftEntryPress = useCallback(() => {
    setShowGiftExplainer(true);
  }, []);

  const loadMode = useCallback(async (targetMode: ExploreMode, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await exploreApi.getHome(targetMode);
      homeByMode.current[targetMode] = res.home;
      setHome(res.home);
    } catch {
      // silent — empty states handle it
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load: resolve stored mode preference, else ask the server for a default.
  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem("userId");
      userIdRef.current = uid;
      const storedMode = uid ? await AsyncStorage.getItem(`exploreMode:${uid}`) : null;

      if (storedMode === "dates" || storedMode === "people") {
        setMode(storedMode);
        setModeReady(true);
        await loadMode(storedMode);
        return;
      }

      // No stored preference — fetch once to learn the server's suggested default.
      try {
        const res = await exploreApi.getHome();
        const resolvedMode = res.defaultMode || "dates";
        homeByMode.current[resolvedMode] = res.home as ExploreHome;
        setMode(resolvedMode);
        setHome(res.home);
        if (uid) await AsyncStorage.setItem(`exploreMode:${uid}`, resolvedMode);
      } catch {
        setMode("dates");
      } finally {
        setModeReady(true);
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSwitchMode = useCallback(
    async (nextMode: ExploreMode) => {
      if (nextMode === mode) return;
      setMode(nextMode);
      if (userIdRef.current) {
        AsyncStorage.setItem(`exploreMode:${userIdRef.current}`, nextMode).catch(() => {});
      }
      const cached = homeByMode.current[nextMode];
      if (cached) {
        setHome(cached);
      } else {
        await loadMode(nextMode);
      }
    },
    [mode, loadMode]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMode(mode, { silent: true });
  };

  const heroSlides = (mode === "people" ? PEOPLE_HERO_SLIDES : DATE_HERO_SLIDES).map((s) => ({
    ...s,
    onPress: () => {
      if (s.id === "dates") navigation.navigate("ExploreCategory", { category: "dates" });
      else if (s.id === "gifts") handleGiftEntryPress();
      else if (s.id === "meetpeople") navigation.navigate("ExploreCategory", { category: "events", audience: "MEET_PEOPLE" });
    },
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ─── Top bar ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {navigation.canGoBack() && (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.backBtn}
            >
              <ChevronLeft size={22} color={theme.colors.textPrimary} />
            </Pressable>
          )}
          <LocationChip city="Chennai" />
        </View>
        <Text style={styles.topTitle}>Explore</Text>
        <View style={styles.topRight}>
          <HeaderAvatar size={34} />
        </View>
      </View>

      {modeReady && <ExploreModeToggle mode={mode} onChange={onSwitchMode} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand}
          />
        }
      >
        {/* ─── Hero carousel ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <HeroCarousel slides={heroSlides} />
        </View>

        {mode === "people" ? (
          <MeetPeopleSection home={home} loading={loading} navigation={navigation} />
        ) : (
          <DateIdeasSection
            home={home}
            loading={loading}
            navigation={navigation}
            onGiftPress={handleGiftEntryPress}
          />
        )}
      </ScrollView>

      <FusePopup
        visible={showGiftExplainer}
        title="Send a gift 🎁"
        message="Gifts are sent inside a conversation, once you've matched and started chatting — that's how we make sure delivery details and eligibility are correct. Head to your chats to pick who to send one to."
        tone="info"
        onClose={() => setShowGiftExplainer(false)}
        primaryAction={{
          label: "Go to Chats",
          onPress: () => {
            setShowGiftExplainer(false);
            navigation.navigate("ChatListScreen");
          },
        }}
        secondaryAction={{ label: "Not now", onPress: () => setShowGiftExplainer(false) }}
      />
    </View>
  );
}

function DateIdeasSection({
  home,
  loading,
  navigation,
  onGiftPress,
}: {
  home: ExploreHome | null;
  loading: boolean;
  navigation: any;
  onGiftPress: () => void;
}) {
  return (
    <>
      {/* ─── Category strip ──────────────────────────────────────────────── */}
      <View style={styles.sectionNoPad}>
        <CategoryStrip
          onSelect={(cat) => {
            if (cat === "gifts") onGiftPress();
            else navigation.navigate("ExploreCategory", { category: cat });
          }}
        />
      </View>

      {/* ─── Date venues rail ────────────────────────────────────────────── */}
      <View style={styles.sectionNoPad}>
        <SectionRail
          title="Perfect for a first date"
          onSeeAll={() => navigation.navigate("ExploreCategory", { category: "dates" })}
        >
          {loading
            ? [1, 2, 3].map((k) => (
                <Skeleton key={k} width={190} height={190} radius={16} />
              ))
            : (home?.featuredVenues ?? []).map((venue) => (
                <VenueCard
                  key={venue._id}
                  venue={venue}
                  onPress={() =>
                    navigation.navigate("VenueDetail", { venueId: venue._id })
                  }
                />
              ))}
          {!loading && (home?.featuredVenues ?? []).length === 0 && (
            <ComingSoonCard
              icon={<Coffee size={22} color={theme.colors.brand} strokeWidth={1.8} />}
              text="Chennai date venues coming soon!"
            />
          )}
        </SectionRail>
      </View>

      {/* ─── Featured events rail ─────────────────────────────────────────── */}
      <View style={styles.sectionNoPad}>
        <SectionRail
          title="Trending this weekend"
          onSeeAll={() => navigation.navigate("ExploreCategory", { category: "events" })}
        >
          {loading
            ? [1, 2].map((k) => (
                <Skeleton key={k} width={200} height={210} radius={16} />
              ))
            : (home?.featuredEvents ?? []).map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onPress={() =>
                    navigation.navigate("EventDetail", { eventId: event._id })
                  }
                />
              ))}
          {!loading && (home?.featuredEvents ?? []).length === 0 && (
            <ComingSoonCard
              icon={<Ticket size={22} color="#7C3AED" strokeWidth={1.8} />}
              text="Chennai events coming soon!"
            />
          )}
        </SectionRail>
      </View>

      {/* ─── Gift suggestions rail ───────────────────────────────────────── */}
      <View style={styles.sectionNoPad}>
        <SectionRail
          title="Thoughtful gifts"
          onSeeAll={onGiftPress}
        >
          {loading
            ? [1, 2, 3].map((k) => (
                <Skeleton key={k} width={148} height={180} radius={16} />
              ))
            : (home?.giftSuggestions ?? []).map((item) => (
                <GiftCard
                  key={item._id}
                  item={item}
                  onPress={onGiftPress}
                />
              ))}
          {!loading && (home?.giftSuggestions ?? []).length === 0 && (
            <ComingSoonCard
              icon={<Gift size={22} color={theme.colors.brand} strokeWidth={1.8} />}
              text="Gift catalog loading..."
            />
          )}
        </SectionRail>
      </View>

      {/* ─── Premium concierge banner ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Pressable
          onPress={() => navigation.navigate("PremiumRequest")}
          style={({ pressed }) => [styles.premiumBanner, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.premiumLeft}>
            <Crown size={22} color="#F59E0B" strokeWidth={1.8} />
            <View>
              <Text style={styles.premiumTitle}>Premium Experiences</Text>
              <Text style={styles.premiumSub}>
                Custom surprises, concierge-planned dates &amp; more
              </Text>
            </View>
          </View>
          <Sparkles size={18} color="#F59E0B" strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* ─── Upcoming events rail ────────────────────────────────────────── */}
      {!loading && (home?.upcomingEvents ?? []).length > 0 && (
        <View style={styles.sectionNoPad}>
          <SectionRail
            title="Upcoming in Chennai"
            onSeeAll={() => navigation.navigate("ExploreCategory", { category: "events" })}
          >
            {home!.upcomingEvents!.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onPress={() =>
                  navigation.navigate("EventDetail", { eventId: event._id })
                }
              />
            ))}
          </SectionRail>
        </View>
      )}
    </>
  );
}

function MeetPeopleSection({
  home,
  loading,
  navigation,
}: {
  home: ExploreHome | null;
  loading: boolean;
  navigation: any;
}) {
  const openEvent = (eventId: string) => navigation.navigate("EventDetail", { eventId });

  return (
    <>
      <View style={styles.sectionNoPad}>
        <CategoryStrip
          categories={SOCIAL_CATEGORIES}
          onSelect={(cat) =>
            navigation.navigate("ExploreCategory", { category: "events", audience: "MEET_PEOPLE", eventCategory: cat })
          }
        />
      </View>

      {!loading && (home?.myUpcomingEvents ?? []).length > 0 && (
        <View style={styles.sectionNoPad}>
          <SectionRail
            title="Your upcoming plans"
            onSeeAll={() => navigation.navigate("MyEvents")}
          >
            {home!.myUpcomingEvents!.map((event) => (
              <EventCard key={event._id} event={event} onPress={() => openEvent(event._id)} />
            ))}
          </SectionRail>
        </View>
      )}

      <View style={styles.sectionNoPad}>
        <SectionRail
          title="This weekend in Chennai"
          onSeeAll={() =>
            navigation.navigate("ExploreCategory", { category: "events", audience: "MEET_PEOPLE" })
          }
        >
          {loading
            ? [1, 2, 3].map((k) => <Skeleton key={k} width={200} height={210} radius={16} />)
            : (home?.thisWeekend ?? []).map((event) => (
                <EventCard key={event._id} event={event} onPress={() => openEvent(event._id)} />
              ))}
          {!loading && (home?.thisWeekend ?? []).length === 0 && (
            <ComingSoonCard
              icon={<Users size={22} color="#7C3AED" strokeWidth={1.8} />}
              text="More Chennai meetups coming soon!"
            />
          )}
        </SectionRail>
      </View>

      <View style={styles.sectionNoPad}>
        <SectionRail
          title="Free to join"
          onSeeAll={() =>
            navigation.navigate("ExploreCategory", { category: "events", audience: "MEET_PEOPLE", pricingType: "FREE_RSVP" })
          }
        >
          {loading
            ? [1, 2].map((k) => <Skeleton key={k} width={200} height={210} radius={16} />)
            : (home?.freeEvents ?? []).map((event) => (
                <EventCard key={event._id} event={event} onPress={() => openEvent(event._id)} />
              ))}
          {!loading && (home?.freeEvents ?? []).length === 0 && (
            <ComingSoonCard
              icon={<Users size={22} color="#7C3AED" strokeWidth={1.8} />}
              text="No free RSVP events yet"
            />
          )}
        </SectionRail>
      </View>

      {!loading && (home?.featuredSocial ?? []).length > 0 && (
        <View style={styles.sectionNoPad}>
          <SectionRail
            title="Featured"
            onSeeAll={() =>
              navigation.navigate("ExploreCategory", { category: "events", audience: "MEET_PEOPLE" })
            }
          >
            {home!.featuredSocial!.map((event) => (
              <EventCard key={event._id} event={event} onPress={() => openEvent(event._id)} />
            ))}
          </SectionRail>
        </View>
      )}
    </>
  );
}

function ComingSoonCard({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <View style={comingSoonStyles.card}>
      {icon}
      <Text style={comingSoonStyles.text}>{text}</Text>
    </View>
  );
}

const comingSoonStyles = StyleSheet.create({
  card: {
    width: 170,
    height: 130,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  text: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: "center",
    lineHeight: 17,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: "center",
    flex: 1,
  },
  topRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  scroll: {
    gap: 24,
    paddingVertical: 4,
  },
  section: {
    paddingHorizontal: 0,
  },
  sectionNoPad: {},
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  premiumLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  premiumTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  premiumSub: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
    maxWidth: 240,
  },
});
