import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Calendar, CheckCircle2, Award } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type EventRsvp } from "../api/exploreApi";
import { EmptyState } from "../../components/ui";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function MyEventsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [upcoming, setUpcoming] = useState<EventRsvp[]>([]);
  const [past, setPast] = useState<EventRsvp[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await exploreApi.getMyEvents();
      setUpcoming(res.upcoming);
      setPast(res.past);
      setBadges(res.eventStats?.badges || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load({ silent: true });
  };

  const RsvpRow = ({ rsvp }: { rsvp: EventRsvp }) => (
    <Pressable
      style={styles.row}
      onPress={() => navigation.navigate("EventDetail", { eventId: rsvp.eventId })}
    >
      <View style={styles.rowLeft}>
        <Calendar size={16} color={theme.colors.textSecondary} strokeWidth={2} />
        <View>
          <Text style={styles.rowTitle}>{rsvp.eventSnapshot?.title || "Event"}</Text>
          <Text style={styles.rowSub}>{formatDate(rsvp.eventSnapshot?.eventDate)}</Text>
        </View>
      </View>
      {rsvp.status === "CHECKED_IN" && (
        <View style={styles.checkedInBadge}>
          <CheckCircle2 size={12} color="#059669" strokeWidth={2.2} />
          <Text style={styles.checkedInText}>Checked in</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>My Events</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          title="No events yet"
          message="RSVP to a Meet People event from Explore to see it here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand} />}
        >
          {badges.includes("FUSE_REGULAR") && (
            <View style={styles.badgeBanner}>
              <Award size={16} color="#B45309" strokeWidth={2} />
              <Text style={styles.badgeBannerText}>Fuse Regular — 3+ events checked in</Text>
            </View>
          )}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcoming.map((r) => (
                <RsvpRow key={r._id} rsvp={r} />
              ))}
            </View>
          )}
          {past.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past</Text>
              {past.map((r) => (
                <RsvpRow key={r._id} rsvp={r} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: theme.fontFamily.bold, fontSize: 18, color: theme.colors.textPrimary },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: { gap: 10 },
  sectionTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowTitle: { fontFamily: theme.fontFamily.semibold, fontSize: 14, color: theme.colors.textPrimary },
  rowSub: { fontFamily: theme.fontFamily.regular, fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  checkedInText: { fontFamily: theme.fontFamily.semibold, fontSize: 11, color: "#059669" },
  badgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  badgeBannerText: { fontFamily: theme.fontFamily.semibold, fontSize: 13, color: "#92400E" },
});
