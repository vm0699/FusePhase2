import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Calendar, MapPin, Ticket, ChevronRight } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type TicketOrder, type TicketOrderStatus } from "../api/exploreApi";

function statusColor(s: TicketOrderStatus): string {
  switch (s) {
    case "CONFIRMED":
    case "FULFILLED":
      return "#059669";
    case "CANCELLED":
    case "REFUND_REQUIRED":
    case "REFUNDED":
      return "#DC2626";
    case "ADMIN_REVIEW":
      return "#D97706";
    default:
      return theme.colors.textSecondary;
  }
}

function statusLabel(s: TicketOrderStatus): string {
  switch (s) {
    case "CREATED":         return "Payment pending";
    case "CONFIRMED":       return "Confirmed";
    case "ADMIN_REVIEW":    return "Processing";
    case "FULFILLED":       return "Tickets sent";
    case "CANCELLED":       return "Cancelled";
    case "REFUND_REQUIRED": return "Refund pending";
    case "REFUNDED":        return "Refunded";
    default:                return s;
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

export default function MyTicketOrdersScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await exploreApi.getMyTicketOrders();
      setOrders(res.orders || []);
    } catch {
      // silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: TicketOrder }) => (
    <View style={styles.card}>
      {/* ─── Event title + status ─────────────────────────────────────────── */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.eventTitle}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* ─── Date ─────────────────────────────────────────────────────────── */}
      <View style={styles.detailRow}>
        <Calendar size={13} color={theme.colors.textTertiary} strokeWidth={2} />
        <Text style={styles.detailText}>{formatDate(item.eventDate)}</Text>
      </View>

      {/* ─── Venue / address ──────────────────────────────────────────────── */}
      {item.eventVenue && (
        <View style={styles.detailRow}>
          <MapPin size={13} color={theme.colors.textTertiary} strokeWidth={2} />
          <Text style={styles.detailText}>
            {item.eventAddress ? item.eventAddress : item.eventVenue + " · Address on fulfillment"}
          </Text>
        </View>
      )}

      {/* ─── Quantity + total ─────────────────────────────────────────────── */}
      <View style={styles.detailRow}>
        <Ticket size={13} color={theme.colors.textTertiary} strokeWidth={2} />
        <Text style={styles.detailText}>
          {item.quantity} ticket{item.quantity !== 1 ? "s" : ""} · ₹{item.totalAmount}
        </Text>
      </View>

      {/* ─── Ticket reference / attachment (if fulfilled) ─────────────────── */}
      {item.status === "FULFILLED" && item.ticketReference && (
        <View style={styles.ticketRefCard}>
          <Text style={styles.ticketRefLabel}>Your ticket reference</Text>
          <Text style={styles.ticketRefValue}>{item.ticketReference}</Text>
          {item.ticketAttachment && (
            <Pressable
              onPress={() => Linking.openURL(item.ticketAttachment!)}
              style={styles.viewTicketBtn}
            >
              <Text style={styles.viewTicketText}>View / Download Ticket</Text>
              <ChevronRight size={14} color={theme.colors.brand} strokeWidth={2.2} />
            </Pressable>
          )}
        </View>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <View style={styles.cardFooter}>
        <Text style={styles.codeText}>#{item.ticketCode}</Text>
        <Text style={styles.createdText}>
          Ordered {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
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
              <Text style={styles.emptyTitle}>No tickets yet</Text>
              <Text style={styles.emptyBody}>
                Browse events in Explore and grab your first tickets.
              </Text>
              <Pressable
                onPress={() => navigation.navigate("ExploreHome")}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Explore events</Text>
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
  eventTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
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
    flex: 1,
  },
  ticketRefCard: {
    backgroundColor: theme.colors.brandSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
    gap: 4,
    marginTop: 4,
  },
  ticketRefLabel: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.brand,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketRefValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  viewTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  viewTicketText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.brand,
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
  createdText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textTertiary,
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
