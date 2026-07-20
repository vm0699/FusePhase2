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
// ScrollView from gesture-handler (not plain react-native) so its horizontal
// pan wins gesture-priority against react-navigation's stack screen-transition
// gesture recognizer, which is also gesture-handler-based and otherwise
// intercepts the drag before a plain RN ScrollView ever sees it.
import { ScrollView } from "react-native-gesture-handler";
import { useNavigation, useRoute } from "@react-navigation/native";
import { giftApi } from "../api/giftApi";
import { FusePopup } from "../../components/FusePopup";
import GiftGridCard, { GiftGridCardItem } from "../../components/GiftGridCard";

// Emoji per category — falls back to 🎁 for anything not listed here so a
// future category added server-side never renders a blank chip.
const CATEGORY_EMOJI: Record<string, string> = {
  "Chocolates & Sweets": "🍫",
  "Flowers & Bouquets": "💐",
  "Plants & Succulents": "🌿",
  "Soft Toys & Cute Gifts": "🧸",
  "Candles & Self-care": "🕯️",
  "Cakes & Bakes": "🎂",
  "Mugs & Drinkware": "☕",
};

// Display priority for category chips (Flowers first, dating-relevance after).
// Any category not listed here falls back to the end, alphabetically.
const CATEGORY_ORDER = [
  "Flowers & Bouquets",
  "Chocolates & Sweets",
  "Soft Toys & Cute Gifts",
  "Cakes & Bakes",
  "Candles & Self-care",
  "Plants & Succulents",
  "Mugs & Drinkware",
];

export default function GiftCatalogScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chatId, recipientId, recipientName } = route.params || {};

  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [popup, setPopup] = useState<{
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
    ) => setPopup({ visible: true, title, message, tone }),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await giftApi.getCatalog({ chatId, recipientId });
      setCatalog(data);
    } catch (err: any) {
      setLoadError(true);
      showPopup("Couldn't load gifts", err?.message || "Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [chatId, recipientId, showPopup]);

  useEffect(() => {
    void load();
  }, [load]);

  // Backend returns { catalog: { low, mid }, suggested }
  const low: GiftGridCardItem[] = catalog?.catalog?.low || [];
  const mid: GiftGridCardItem[] = catalog?.catalog?.mid || [];
  const allItems: GiftGridCardItem[] = [...low, ...mid];
  const suggested: GiftGridCardItem[] = catalog?.suggested || [];

  // Category chips are built from whatever categories are actually present
  // in the loaded catalog — no hardcoded list to fall out of sync with the DB —
  // then sorted by CATEGORY_ORDER (Flowers first, etc.).
  const categories = (
    Array.from(new Set(allItems.map((i) => i.category).filter(Boolean))) as string[]
  ).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const filteredItems =
    selectedCategory === "ALL"
      ? allItems
      : allItems.filter((i: any) => i.category === selectedCategory);

  const handleSelect = (item: GiftGridCardItem) => {
    navigation.navigate("GiftItemDetail", {
      chatId,
      catalogItemId: item.itemId, // backend uses itemId
      recipientName,
      recipientId,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Send a Gift</Text>
          {!!recipientName && (
            <Text style={styles.headerSub} numberOfLines={1}>
              to {recipientName}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category chips — a sibling of the FlatList (not inside its header).
          A horizontal ScrollView nested inside a FlatList's ListHeaderComponent
          fights the FlatList's own touch responder on Android and doesn't
          scroll; living outside it here also makes it a persistent filter bar
          that stays visible while the grid below scrolls. */}
      {!loading && !loadError && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsRow}
        >
          {[{ key: "ALL", label: "All" }, ...categories.map((c) => ({
            key: c,
            label: `${CATEGORY_EMOJI[c] || "🎁"} ${c}`,
          }))].map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff5864" />
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Couldn't load gifts right now.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => item.itemId ?? String(index)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No gifts for this filter.</Text>
            </View>
          }
          ListHeaderComponent={
            // Must be a single View (not Fragment) with numColumns FlatList
            <View>
              {/* Suggested strip */}
              {suggested.length > 0 && (
                <View style={styles.suggestedSection}>
                  <Text style={styles.sectionLabel}>
                    Suggested for {recipientName || "them"} ✨
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestedScroll}
                  >
                    {suggested.map((item, idx) => (
                      <View key={item.itemId ?? String(idx)} style={styles.suggestedCardWrap}>
                        <GiftGridCard item={item} onPress={handleSelect} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.allLabel}>All gifts</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GiftGridCard item={item} onPress={handleSelect} />
          )}
        />
      )}

      {/* Safety disclaimer pinned at bottom */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          🔒 Platform-verified gifts only · Address always private
        </Text>
      </View>

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
    backgroundColor: "#FAF8F3",
  },
  backButton: {
    minWidth: 60,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  backText: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#6B7280" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Poppins-Bold", fontSize: 22, color: "#1a1a1a" },
  headerSub: { fontFamily: "Poppins", fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  headerSpacer: { width: 60 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  suggestedSection: { marginBottom: 4 },
  sectionLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: "#1a1a1a",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  suggestedScroll: { paddingHorizontal: 10 },
  suggestedCardWrap: { width: 160, marginRight: 2 },

  chipsRow: {
    flexGrow: 0,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  chipsScroll: { paddingHorizontal: 12, alignItems: "center" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#ff5864" },
  chipText: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#6B7280" },
  chipTextActive: { color: "#ffffff" },

  allLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: "#1a1a1a",
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  listContent: { paddingHorizontal: 10, paddingBottom: 80 },
  columnWrapper: { justifyContent: "flex-start" },

  emptyWrap: { alignItems: "center", paddingTop: 48 },
  emptyText: { fontFamily: "Poppins", fontSize: 14, color: "#9CA3AF" },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#ff5864",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#ffffff" },

  disclaimer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FAF8F3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
  },
  disclaimerText: { fontFamily: "Poppins", fontSize: 11, color: "#9CA3AF" },
});
