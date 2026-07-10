import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Sparkles, Users } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi from "../api/exploreApi";
import { EmptyState } from "../../components/ui";

type RouteParams = { eventId: string };

type Attendee = {
  userId: string;
  name: string;
  age: number | null;
  photo?: string;
  sharedInterestCount: number;
  waveStatus: "NONE" | "PENDING" | "MATCHED";
};

export default function EventCircleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { eventId } = (route.params || {}) as RouteParams;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [teaser, setTeaser] = useState<{ goingCount: number; genderBalance: any; sharedInterestCount: number } | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [waveBusyId, setWaveBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exploreApi.getEventCircle(eventId);
      setHasAccess(res.hasAccess);
      setTeaser(res.teaser || null);
      setAttendees((res.attendees as Attendee[]) || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const wavesSent = attendees.filter((a) => a.waveStatus !== "NONE").length;

  const handleWave = async (attendee: Attendee) => {
    if (attendee.waveStatus !== "NONE") return;
    setWaveBusyId(attendee.userId);
    try {
      const res = await exploreApi.waveAtAttendee(eventId, attendee.userId);
      if (res.isMatch && res.chatId) {
        const otherUser = res.otherUser || { _id: attendee.userId, name: attendee.name, photos: attendee.photo ? [attendee.photo] : [] };
        Alert.alert("It's a match! 🎉", `You and ${attendee.name} matched.`, [
          {
            text: "Say hi",
            onPress: () =>
              navigation.navigate("ChatScreen", {
                chatId: res.chatId,
                receiverId: otherUser._id,
                actualReceiverId: otherUser._id,
                receiverUsername: otherUser.name,
                otherUser,
                chatStatus: "accepted",
                showMatchedBanner: true,
              }),
          },
        ]);
        setAttendees((prev) =>
          prev.map((a) => (a.userId === attendee.userId ? { ...a, waveStatus: "MATCHED" } : a))
        );
      } else {
        setAttendees((prev) =>
          prev.map((a) => (a.userId === attendee.userId ? { ...a, waveStatus: "PENDING" } : a))
        );
      }
    } catch (err: any) {
      Alert.alert("Couldn't wave", err?.message || "Please try again.");
    } finally {
      setWaveBusyId(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>Who's going</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      ) : !hasAccess ? (
        <View style={styles.teaserWrap}>
          <Users size={28} color={theme.colors.brand} strokeWidth={1.8} />
          <Text style={styles.teaserTitle}>
            {teaser?.goingCount || 0} from Fuse going
          </Text>
          {teaser && (
            <Text style={styles.teaserSub}>
              {teaser.genderBalance.men} men · {teaser.genderBalance.women} women
              {teaser.sharedInterestCount > 0 ? ` · ${teaser.sharedInterestCount} share your interests` : ""}
            </Text>
          )}
          <Text style={styles.teaserHint}>RSVP to this event to see who's going and connect.</Text>
        </View>
      ) : attendees.length === 0 ? (
        <EmptyState title="No one else yet" message="Check back closer to the event — Fuse attendees will show up here." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 12 }}>
          <Text style={styles.wavesLeft}>{Math.max(0, 3 - wavesSent)} waves left for this event</Text>
          {attendees.map((a) => (
            <View key={a.userId} style={styles.card}>
              <View style={styles.cardLeft}>
                {a.photo ? (
                  <Image source={{ uri: a.photo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]} />
                )}
                <View>
                  <Text style={styles.name}>
                    {a.name}
                    {a.age != null ? `, ${a.age}` : ""}
                  </Text>
                  {a.sharedInterestCount > 0 && (
                    <Text style={styles.shared}>{a.sharedInterestCount} shared interests</Text>
                  )}
                </View>
              </View>
              <Pressable
                style={[
                  styles.waveBtn,
                  a.waveStatus !== "NONE" && styles.waveBtnSent,
                ]}
                onPress={() => handleWave(a)}
                disabled={a.waveStatus !== "NONE" || waveBusyId === a.userId}
              >
                {waveBusyId === a.userId ? (
                  <ActivityIndicator size="small" color={theme.colors.brand} />
                ) : (
                  <>
                    <Sparkles size={14} color={a.waveStatus !== "NONE" ? theme.colors.textTertiary : theme.colors.brand} strokeWidth={2} />
                    <Text style={[styles.waveBtnText, a.waveStatus !== "NONE" && styles.waveBtnTextSent]}>
                      {a.waveStatus === "MATCHED" ? "Matched" : a.waveStatus === "PENDING" ? "Waved" : "Wave"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ))}
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
  teaserWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  teaserTitle: { fontFamily: theme.fontFamily.bold, fontSize: 18, color: theme.colors.textPrimary, marginTop: 8 },
  teaserSub: { fontFamily: theme.fontFamily.regular, fontSize: 13, color: theme.colors.textSecondary, textAlign: "center" },
  teaserHint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textTertiary,
    textAlign: "center",
    marginTop: 12,
  },
  wavesLeft: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: "center",
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surfaceSunken },
  avatarPlaceholder: { backgroundColor: "#EDE9FE" },
  name: { fontFamily: theme.fontFamily.semibold, fontSize: 14, color: theme.colors.textPrimary },
  shared: { fontFamily: theme.fontFamily.regular, fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  waveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  waveBtnSent: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
  },
  waveBtnText: { fontFamily: theme.fontFamily.semibold, fontSize: 12, color: theme.colors.brand },
  waveBtnTextSent: { color: theme.colors.textTertiary },
});
