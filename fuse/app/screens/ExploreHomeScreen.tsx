import React, { useEffect, useState, useCallback } from "react";
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
import { Gift, Coffee, Ticket, Crown, Sparkles, ChevronLeft } from "lucide-react-native";

import { theme } from "../theme";
import exploreApi, { type ExploreHome } from "../api/exploreApi";
import LocationChip from "../../components/ui/explore/LocationChip";
import HeroCarousel from "../../components/ui/explore/HeroCarousel";
import CategoryStrip from "../../components/ui/explore/CategoryStrip";
import SectionRail from "../../components/ui/explore/SectionRail";
import VenueCard from "../../components/ui/explore/VenueCard";
import EventCard from "../../components/ui/explore/EventCard";
import GiftCard from "../../components/ui/explore/GiftCard";
import HeaderAvatar from "../../components/ui/HeaderAvatar";
import { Skeleton } from "../../components/ui";

const HERO_SLIDES = [
  {
    id: "dates",
    title: "Plan a real date 🍵",
    subtitle: "Book curated Chennai cafés & restaurants",
    bgColor: "#ff5864",
  },
  {
    id: "events",
    title: "What's happening this weekend?",
    subtitle: "Local events, comedy nights & more",
    bgColor: "#7C3AED",
  },
  {
    id: "gifts",
    title: "Send a thoughtful gift",
    subtitle: "Safe, platform-approved gifts from ₹199",
    bgColor: "#059669",
  },
];

export default function ExploreHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [home, setHome] = useState<ExploreHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await exploreApi.getHome();
      setHome(res.home);
    } catch {
      // silent — empty states handle it
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const slides = HERO_SLIDES.map((s) => ({
    ...s,
    onPress: () => {
      if (s.id === "dates") navigation.navigate("ExploreCategory", { category: "dates" });
      else if (s.id === "events") navigation.navigate("ExploreCategory", { category: "events" });
      else if (s.id === "gifts") navigation.navigate("GiftCatalog");
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
          <HeroCarousel slides={slides} />
        </View>

        {/* ─── Category strip ──────────────────────────────────────────────── */}
        <View style={styles.sectionNoPad}>
          <CategoryStrip
            onSelect={(cat) => {
              if (cat === "gifts") navigation.navigate("GiftCatalog");
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
            onSeeAll={() => navigation.navigate("GiftCatalog")}
          >
            {loading
              ? [1, 2, 3].map((k) => (
                  <Skeleton key={k} width={148} height={180} radius={16} />
                ))
              : (home?.giftSuggestions ?? []).map((item) => (
                  <GiftCard
                    key={item._id}
                    item={item}
                    onPress={() =>
                      navigation.navigate("GiftItemDetail", { catalogItemId: item._id })
                    }
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
              {home!.upcomingEvents.map((event) => (
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
      </ScrollView>
    </View>
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
