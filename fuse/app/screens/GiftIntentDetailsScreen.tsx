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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authedFetch } from "../auth/apiClient";
import { authClient } from "../auth/authClient";
import { FusePopup } from "../../components/FusePopup";

type GiftIntentItem = {
  itemId?: string;
  name?: string;
  quantity?: number;
  price?: number;
};

type GiftIntentDetails = {
  intentId: string;
  chatId?: string;
  tier: string;
  status: string;
  totalAmount: number;
  items: GiftIntentItem[];
  senderId: string;
  recipientId: string;
  counterpart?: {
    id?: string;
    name?: string;
    username?: string;
  };
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function GiftIntentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { intentId } = route.params || {};

  const [intent, setIntent] = useState<GiftIntentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
    ) => {
      setPopupState({ visible: true, title, message, tone });
    },
    []
  );

  const loadIntent = useCallback(async () => {
    if (!intentId) {
      setLoading(false);
      return;
    }

    try {
      const [storedUserId, res] = await Promise.all([
        AsyncStorage.getItem("userId"),
        authedFetch({
          input: `${authClient.BASE_URL}/api/chat/gift-intent/${intentId}`,
          init: { method: "GET" },
        }),
      ]);

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load gift intent");
      }

      setCurrentUserId(storedUserId);
      setIntent(data?.intent || null);
    } catch (error: any) {
      showPopup("Error", error?.message || "Failed to load gift intent.", "error");
    } finally {
      setLoading(false);
    }
  }, [intentId, showPopup]);

  useEffect(() => {
    void loadIntent();
  }, [loadIntent]);

  const handleIntentAction = useCallback(
    async (action: "accept" | "reject") => {
      if (!intentId || updating) return;
      setUpdating(true);

      try {
        const res = await authedFetch({
          input: `${authClient.BASE_URL}/api/chat/gift-intent/${intentId}/${action}`,
          init: { method: "POST" },
        });

        const data = await safeJson(res);
        if (!res.ok) {
          throw new Error(data?.message || `Failed to ${action} gift intent`);
        }

        await loadIntent();
        showPopup(
          action === "accept" ? "Gift accepted" : "Gift declined",
          action === "accept"
            ? "The sender can proceed with payment."
            : "The gift intent has been declined.",
          "success"
        );
      } catch (error: any) {
        showPopup("Error", error?.message || "Request failed.", "error");
      } finally {
        setUpdating(false);
      }
    },
    [intentId, loadIntent, showPopup, updating]
  );

  const canRespond =
    !!intent &&
    currentUserId === intent.recipientId &&
    intent.status === "AWAITING_RECIPIENT";

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
          <Text style={styles.headerTitle}>Gift intent</Text>
          <Text style={styles.headerSubtitle}>
            Review the current gift request
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : intent ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{intent.status}</Text>
            <Text style={styles.label}>Counterpart</Text>
            <Text style={styles.value}>
              {intent.counterpart?.name || intent.counterpart?.username || "Fuse user"}
            </Text>
            <Text style={styles.label}>Tier</Text>
            <Text style={styles.value}>{intent.tier}</Text>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>₹{intent.totalAmount}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {intent.items?.map((item, index) => (
              <View key={`${item.itemId || item.name || "item"}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name || "Gift item"}</Text>
                <Text style={styles.itemMeta}>
                  Qty {item.quantity || 1} • ₹{item.price || 0}
                </Text>
              </View>
            ))}
          </View>

          {canRespond ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryButton, updating && styles.buttonDisabled]}
                onPress={() => void handleIntentAction("accept")}
                disabled={updating}
              >
                <Text style={styles.primaryText}>
                  {updating ? "Updating..." : "Accept"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, updating && styles.buttonDisabled]}
                onPress={() => void handleIntentAction("reject")}
                disabled={updating}
              >
                <Text style={styles.secondaryText}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("ChatListScreen")}
          >
            <Text style={styles.linkText}>Open chats</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Gift intent unavailable.</Text>
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
  sectionTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 10,
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#ff5864",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontFamily: "Poppins-Bold",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryText: {
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  buttonDisabled: {
    opacity: 0.6,
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
