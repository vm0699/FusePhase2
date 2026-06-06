import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authedFetch } from "../auth/apiClient";
import { authClient } from "../auth/authClient";
import { FusePopup } from "../../components/FusePopup";

type GiftOrder = {
  orderId: string;
  status: string;
  totalAmount: number;
  currency?: string;
  counterpart?: {
    name?: string;
    username?: string;
  };
  tracking?: {
    trackingUrl?: string | null;
    dispatchedAt?: string | null;
    deliveredAt?: string | null;
  };
  items?: Array<{
    itemId?: string;
    name?: string;
    quantity?: number;
    price?: number;
  }>;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function GiftOrderTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState<GiftOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  const showPopup = useCallback(
    (
      title: string,
      message?: string,
      tone: "default" | "success" | "error" | "info" = "default"
    ) => setPopupState({ visible: true, title, message, tone }),
    []
  );

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const res = await authedFetch({
        input: `${authClient.BASE_URL}/api/chat/gifts/order/${orderId}`,
        init: { method: "GET" },
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load gift order");
      }

      setOrder(data?.order || null);
    } catch (error: any) {
      showPopup("Error", error?.message || "Failed to load gift order.", "error");
    } finally {
      setLoading(false);
    }
  }, [orderId, showPopup]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gift tracking</Text>
          <Text style={styles.headerSubtitle}>
            Follow the current order status
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : order ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{order.status}</Text>
            <Text style={styles.label}>Counterpart</Text>
            <Text style={styles.value}>
              {order.counterpart?.name || order.counterpart?.username || "Fuse user"}
            </Text>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>
              {order.currency || "INR"} {order.totalAmount}
            </Text>
            <Text style={styles.label}>Tracking link</Text>
            <Text style={styles.trackingValue}>
              {order.tracking?.trackingUrl || "Tracking link not available yet"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <Text style={styles.timelineText}>
              Dispatched: {order.tracking?.dispatchedAt || "Pending"}
            </Text>
            <Text style={styles.timelineText}>
              Delivered: {order.tracking?.deliveredAt || "Pending"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items?.map((item, index) => (
              <View key={`${item.itemId || item.name || "item"}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name || "Gift item"}</Text>
                <Text style={styles.itemMeta}>
                  Qty {item.quantity || 1} • ₹{item.price || 0}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("ChatListScreen")}
          >
            <Text style={styles.linkText}>Open chats</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Gift order unavailable.</Text>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
  },
  headerButton: {
    minWidth: 70,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: {
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
  },
  headerSpacer: { width: 70 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Poppins-SemiBold",
    marginTop: 8,
  },
  value: {
    marginTop: 4,
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  trackingValue: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 10,
  },
  timelineText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins",
    marginBottom: 6,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemName: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  linkText: {
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  emptyText: {
    color: "#6B7280",
    fontFamily: "Poppins",
  },
});
