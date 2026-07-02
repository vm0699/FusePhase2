import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Calendar, Users, Clock, ChevronRight } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type Booking, type BookingStatus } from "../api/exploreApi";

function statusColor(s: BookingStatus): string {
  switch (s) {
    case "CONFIRMED":
    case "FULFILLED":
      return "#059669";
    case "CANCELLED":
    case "REFUND_REQUIRED":
    case "REFUNDED":
      return "#DC2626";
    case "ADMIN_REVIEW":
    case "INVITE_PENDING":
      return "#D97706";
    default:
      return theme.colors.textSecondary;
  }
}

function statusLabel(s: BookingStatus): string {
  switch (s) {
    case "CREATED":        return "Payment pending";
    case "INVITE_PENDING": return "Invite sent";
    case "CONFIRMED":      return "Confirmed";
    case "ADMIN_REVIEW":   return "Under review";
    case "FULFILLED":      return "Completed";
    case "CANCELLED":      return "Cancelled";
    case "REFUND_REQUIRED": return "Refund in progress";
    case "REFUNDED":       return "Refunded";
    default:               return s;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MyBookingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await exploreApi.getMyBookings();
      setBookings(res.bookings || []);
    } catch {
      // silently fail on background refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleInviteResponse = async (bookingId: string, action: "ACCEPT" | "DECLINE") => {
    const verb = action === "ACCEPT" ? "accept" : "decline";
    Alert.alert(
      `${action === "ACCEPT" ? "Accept" : "Decline"} invite`,
      `Are you sure you want to ${verb} this date invite?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "ACCEPT" ? "Accept" : "Decline",
          style: action === "DECLINE" ? "destructive" : "default",
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await exploreApi.respondToBookingInvite(bookingId, action);
              await load();
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Action failed. Please try again.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      "Cancel booking",
      "Are you sure you want to cancel this booking? The booking fee may not be refunded.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await exploreApi.cancelBooking(bookingId);
              await load();
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Could not cancel booking.");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const isActing = actionLoading === item._id;
    const canCancel = ["CREATED", "CONFIRMED", "INVITE_PENDING"].includes(item.status);

    return (
      <View style={styles.card}>
        {/* ─── Venue + date header ──────────────────────────────────────── */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.venueName}>{item.venueSnapshot?.name ?? "Venue"}</Text>
            <Text style={styles.venueArea}>
              {item.venueSnapshot?.area ?? ""}{item.venueSnapshot?.city ? ` · ${item.venueSnapshot.city}` : ""}
            </Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* ─── Details ─────────────────────────────────────────────────── */}
        <View style={styles.detailRow}>
          <Calendar size={13} color={theme.colors.textTertiary} strokeWidth={2} />
          <Text style={styles.detailText}>{formatDate(item.bookingDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Users size={13} color={theme.colors.textTertiary} strokeWidth={2} />
          <Text style={styles.detailText}>
            {item.partySize} guest{item.partySize !== 1 ? "s" : ""}
            {item.invitedMatchName ? ` · Invited ${item.invitedMatchName}` : ""}
          </Text>
        </View>

        {/* ─── Invite expiry ───────────────────────────────────────────── */}
        {item.inviteStatus === "PENDING" && item.inviteExpiresAt && (
          <View style={styles.inviteNotice}>
            <Clock size={12} color="#D97706" strokeWidth={2} />
            <Text style={styles.inviteNoticeText}>
              Invite expires {formatTime(item.inviteExpiresAt)} ·{" "}
              {formatDate(item.inviteExpiresAt)}
            </Text>
          </View>
        )}

        {/* ─── Address (only when confirmed) ───────────────────────────── */}
        {item.venueSnapshot?.address && (
          <Text style={styles.addressText}>
            📍 {item.venueSnapshot.address}
          </Text>
        )}

        {/* ─── Invite response actions ─────────────────────────────────── */}
        {/* The invitee needs to see accept/decline — detect by checking booking
            role via inviteStatus but no invitedMatchName meaning WE are the invitee */}
        {item.inviteStatus === "PENDING" && !item.invitedMatchName && (
          <View style={styles.inviteActions}>
            {isActing ? (
              <ActivityIndicator color={theme.colors.brand} size="small" />
            ) : (
              <>
                <Pressable
                  onPress={() => handleInviteResponse(item._id, "ACCEPT")}
                  style={styles.acceptBtn}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleInviteResponse(item._id, "DECLINE")}
                  style={styles.declineBtn}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* ─── Footer actions ──────────────────────────────────────────── */}
        <View style={styles.cardFooter}>
          <Text style={styles.codeText}>#{item.bookingCode}</Text>
          <View style={styles.footerRight}>
            {canCancel && !item.inviteStatus?.includes("PENDING") && (
              <Pressable
                onPress={() => handleCancel(item._id)}
                disabled={isActing}
                style={styles.cancelLink}
              >
                {isActing ? (
                  <ActivityIndicator size="small" color={theme.colors.errorFg} />
                ) : (
                  <Text style={styles.cancelText}>Cancel</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[theme.colors.brand]}
              tintColor={theme.colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyBody}>
                Browse venues in Explore and book your first date.
              </Text>
              <Pressable
                onPress={() => navigation.navigate("ExploreHome")}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Explore now</Text>
                <ChevronRight size={15} color={theme.colors.brand} strokeWidth={2.2} />
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 2,
  },
  venueName: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  venueArea: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 11,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  inviteNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF9EC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  inviteNoticeText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: "#92400E",
  },
  addressText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    color: "#fff",
  },
  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 8,
    marginTop: 2,
  },
  codeText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancelLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 12,
    color: theme.colors.errorFg,
  },
  emptyWrap: {
    paddingTop: 80,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
    backgroundColor: theme.colors.brandSoft,
    gap: 4,
  },
  emptyBtnText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 14,
    color: theme.colors.brand,
  },
});
