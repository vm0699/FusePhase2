import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { giftApi } from "../api/giftApi";
import { FusePopup } from "../../components/FusePopup";
import GiftGridCard, { GiftGridCardItem } from "../../components/GiftGridCard";

const OCCASIONS = [
  { key: "ALL", label: "All" },
  { key: "FIRST_DATE", label: "🌹 First Date" },
  { key: "CELEBRATION", label: "🎉 Celebration" },
  { key: "JUST_BECAUSE", label: "🎁 Just Because" },
  { key: "THANK_YOU", label: "🙏 Thank You" },
  { key: "APOLOGY", label: "💙 Apology" },
];

export default function GiftCatalogScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chatId, recipientId, recipientName } = route.params || {};

  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState("ALL");
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
    try {
      const data = await giftApi.getCatalog({ chatId, recipientId });
      setCatalog(data);
    } catch (err: any) {
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

  const filteredItems =
    selectedOccasion === "ALL"
      ? allItems
      : allItems.filter((i: any) => i.occasion === selectedOccasion);

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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff5864" />
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

              {/* Occasion chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {OCCASIONS.map((occ) => {
                  const active = selectedOccasion === occ.key;
                  return (
                    <TouchableOpacity
                      key={occ.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedOccasion(occ.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {occ.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

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

  chipsScroll: { paddingHorizontal: 12, paddingVertical: 10 },
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
