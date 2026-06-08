import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { giftApi, GiftOrderView } from "../api/giftApi";
import GiftStatusBadge from "../../components/GiftStatusBadge";
import { FusePopup } from "../../components/FusePopup";

type Tab = "SENT" | "RECEIVED";

export default function MyGiftsScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>("SENT");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<GiftOrderView[]>([]);
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        tab === "SENT"
          ? await giftApi.getSentGifts(1)
          : await giftApi.getReceivedGifts(1);
      setOrders(data.orders || []);
    } catch (error: any) {
      setPopup({
        visible: true,
        title: "Error",
        message: error?.message || "Failed to load gifts.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const renderItem = ({ item }: { item: GiftOrderView }) => {
    const name =
      item.counterpart?.name || item.counterpart?.username || "Fuse user";
    const itemName = item.items?.[0]?.name || "Gift";
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("GiftOrderTrackingScreen", {
            orderId: item.orderId,
            chatId: item.chatId,
          })
        }
      >
        <View style={styles.rowIcon}>
          <Text style={{ fontSize: 22 }}>🎁</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {itemName}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {tab === "SENT" ? `To ${name}` : `From ${name}`} • ₹{item.totalAmount}
          </Text>
        </View>
        <GiftStatusBadge status={item.status} label={item.statusLabel} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My gifts</Text>
          <Text style={styles.headerSubtitle}>Sent & received</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsRow}>
        {(["SENT", "RECEIVED"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "SENT" ? "Sent" : "Received"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {tab === "SENT"
                ? "You haven't sent any gifts yet."
                : "No gifts received yet."}
            </Text>
          }
        />
      )}

      <FusePopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        tone={popup.tone}
        onClose={() => setPopup((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 12,
  },
  headerButton: {
    minWidth: 70,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: { color: "#6B7280", fontFamily: "Poppins-SemiBold" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 24, color: "#1a1a1a", fontFamily: "Poppins-Bold" },
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", fontFamily: "Poppins" },
  headerSpacer: { width: 70 },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
  tabActive: { backgroundColor: "#ff5864" },
  tabText: { color: "#6B7280", fontFamily: "Poppins-SemiBold", fontSize: 14 },
  tabTextActive: { color: "#ffffff" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FAF8F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowBody: { flex: 1, marginRight: 10 },
  rowTitle: { fontSize: 15, color: "#1a1a1a", fontFamily: "Poppins-SemiBold" },
  rowSub: { marginTop: 2, fontSize: 13, color: "#6B7280", fontFamily: "Poppins" },
  emptyText: {
    color: "#6B7280",
    fontFamily: "Poppins",
    textAlign: "center",
    marginTop: 40,
  },
});
