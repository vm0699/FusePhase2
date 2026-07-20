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
import { useNavigation, useRoute } from "@react-navigation/native";
import { giftApi, GiftOrderView } from "../api/giftApi";
import GiftStatusBadge from "../../components/GiftStatusBadge";
import { FusePopup } from "../../components/FusePopup";

export default function ChatGiftOrdersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chatId, recipientName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [orders, setOrders] = useState<GiftOrderView[]>([]);
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  const load = useCallback(async () => {
    if (!chatId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const data = await giftApi.getChatGiftOrders(chatId);
      setOrders(data.orders || []);
    } catch (error: any) {
      setLoadError(true);
      setPopup({
        visible: true,
        title: "Couldn't load gifts",
        message: error?.message || "Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    void load();
  }, [load]);

  const renderItem = ({ item }: { item: GiftOrderView }) => {
    const itemName = item.items?.[0]?.name || "Gift";
    const directionLabel = item.perspective === "SENDER" ? "You sent" : "They sent";
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
            {directionLabel} • ₹{item.totalAmount}
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
          <Text style={styles.headerTitle}>Gift orders</Text>
          {!!recipientName && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              with {recipientName}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : loadError ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Couldn't load gifts right now.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No gifts exchanged in this chat yet.</Text>
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
  headerTitle: { fontSize: 20, color: "#1a1a1a", fontFamily: "Poppins-Bold" },
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", fontFamily: "Poppins", marginTop: 1 },
  headerSpacer: { width: 70 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
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
  retryButton: {
    marginTop: 16,
    backgroundColor: "#ff5864",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#ffffff" },
});
