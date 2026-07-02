import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MapPin,
  Video,
  Bell,
  Shield,
  HelpCircle,
  Lock,
  Trash2,
  ChevronRight,
  Mail,
} from "lucide-react-native";
import { FusePopup } from "../../components/FusePopup";
import { authClient } from "../auth/authClient";
import { pushManager } from "../notifications/pushManager";
import { API_BASE_URL } from "../config/env";
import { theme } from "../theme";

const BASE_URL = API_BASE_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingRow = {
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
};

type SettingGroup = {
  header: string;
  rows: SettingRow[];
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
    onClose?: () => void;
  }>({ visible: false, title: "" });

  const showPopup = (
    title: string,
    message?: string,
    tone: "default" | "success" | "error" | "info" = "default",
    onClose?: () => void
  ) => {
    setPopupState({ visible: true, title, message, tone, onClose });
  };

  // Request Location Permission
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showPopup(
        "Permission Denied",
        "Enable location in settings to use this feature.",
        "error"
      );
      return;
    }
    getCurrentLocation();
  };

  // Fetch Current Location
  const getCurrentLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Store location in backend
      const token = await AsyncStorage.getItem("jwtToken");
      await fetch(`${BASE_URL}/api/user/update-location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });
    } catch (error) {
      showPopup("Error", "Failed to get location.", "error");
      console.error("Location error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem("jwtToken");
      await pushManager.unregisterCurrentDevice();
      const res = await fetch(`${BASE_URL}/api/user/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to delete account");

      await authClient.logoutLocal();

      const keys = await AsyncStorage.getAllKeys();
      if (keys && keys.length) {
        await AsyncStorage.multiRemove(keys);
      }
      showPopup(
        "Account deleted",
        "Account deleted successfully.",
        "success",
        () => (navigation as any).reset({ index: 0, routes: [{ name: "Login" }] })
      );
    } catch (err) {
      showPopup("Error", "Could not delete your account. Please try again.", "error");
    } finally {
      setDeleting(false);
      setShowDeletePopup(false);
    }
  };

  const handleSaveEmail = async () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    setSavingEmail(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const res = await fetch(`${BASE_URL}/api/profile/add-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: trimmed }),
      });
      const result = await res.json();

      if (!result.success) {
        showPopup("Error", result.message || "Failed to save email.", "error");
        return;
      }

      setShowEmailModal(false);
      setEmailInput("");
      showPopup(
        "Email linked",
        "You can now log in with this email instead of your phone number.",
        "success"
      );
    } catch (err) {
      showPopup("Error", "Could not save your email. Please try again.", "error");
    } finally {
      setSavingEmail(false);
    }
  };

  // ─── Setting groups ─────────────────────────────────────────────────────────

  const groups: SettingGroup[] = [
    {
      header: "Account",
      rows: [
        {
          label: "Delivery location",
          sublabel: "Update address for gifts & surprises",
          icon: MapPin,
          route: "UpdateDeliveryLocation",
        },
        {
          label: "Add email for backup login",
          sublabel: "Sign in with email instead of your phone",
          icon: Mail,
          onPress: () => setShowEmailModal(true),
        },
      ],
    },
    {
      header: "Preferences",
      rows: [
        {
          label: "Video autoplay",
          icon: Video,
          route: "Video Autoplay",
        },
        {
          label: "Notifications",
          icon: Bell,
          route: "NotificationSettings",
        },
        {
          label: "Privacy settings",
          icon: Lock,
          route: "Privacy Settings",
        },
      ],
    },
    {
      header: "Safety & Support",
      rows: [
        {
          label: "Security & privacy",
          icon: Shield,
          route: "SecuritySettings",
        },
        {
          label: "Contact & FAQ",
          icon: HelpCircle,
          route: "Contact FAQ",
        },
      ],
    },
    {
      header: "Danger zone",
      rows: [
        {
          label: "Delete account",
          icon: Trash2,
          danger: true,
          onPress: () => setShowDeletePopup(true),
        },
      ],
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  const renderGroup = (group: SettingGroup, gIdx: number) => (
    <View key={gIdx} style={styles.group}>
      <Text style={styles.groupHeader}>{group.header.toUpperCase()}</Text>
      <View style={[styles.groupCard, group.header === "Danger zone" && styles.groupCardDanger]}>
        {group.rows.map((row, rIdx) => {
          const IconComp = row.icon;
          const isLast = rIdx === group.rows.length - 1;
          return (
            <TouchableOpacity
              key={rIdx}
              style={[styles.row, !isLast && styles.rowDivider]}
              onPress={() => {
                if (row.onPress) {
                  row.onPress();
                } else if (row.route) {
                  (navigation as any).navigate(row.route);
                }
              }}
              activeOpacity={0.65}
            >
              <View style={[styles.iconBubble, row.danger && styles.iconBubbleDanger]}>
                <IconComp
                  size={16}
                  color={row.danger ? theme.colors.errorFg : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, row.danger && styles.rowLabelDanger]}>
                  {row.label}
                </Text>
                {!!row.sublabel && (
                  <Text style={styles.rowSublabel}>{row.sublabel}</Text>
                )}
              </View>
              {!row.danger && (
                <ChevronRight size={16} color={theme.colors.textTertiary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate("Profile" as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Privacy, safety & preferences</Text>
        </View>
        {/* Spacer to balance back button — invisible, reserves width only */}
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group, idx) => renderGroup(group, idx))}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBar} />
          <Text style={styles.footerText}>Version 5.392.0</Text>
          <Text style={styles.footerText}>Made with love.</Text>
        </View>
      </ScrollView>

      {/* Delete account confirmation modal */}
      <Modal visible={showDeletePopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Trash2 size={26} color={theme.colors.errorFg} />
            </View>
            <Text style={styles.modalTitle}>Wait. Leaving so soon?</Text>
            <Text style={styles.modalText}>
              Deleting your account will remove all chats, likes, and photos permanently.
            </Text>
            <TouchableOpacity
              style={styles.modalDeleteBtn}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <Text style={styles.modalDeleteText}>
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowDeletePopup(false)}
            >
              <Text style={styles.modalCancelText}>No, I changed my mind</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add email modal */}
      <Modal visible={showEmailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Mail size={26} color={theme.colors.brand} />
            </View>
            <Text style={styles.modalTitle}>Add backup email</Text>
            <Text style={styles.modalText}>
              Link an email to your account so you can log in with it instead of your phone number.
            </Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Email address"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={emailInput}
              onChangeText={setEmailInput}
            />
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveEmail}
              disabled={savingEmail}
            >
              <Text style={styles.modalSaveText}>
                {savingEmail ? "Saving…" : "Save email"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowEmailModal(false);
                setEmailInput("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FusePopup
        visible={popupState.visible}
        title={popupState.title}
        message={popupState.message}
        tone={popupState.tone}
        onClose={() => {
          const onClose = popupState.onClose;
          setPopupState((prev) => ({ ...prev, visible: false, onClose: undefined }));
          onClose?.();
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 0 : 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  spacer: {
    width: 38,
    height: 38,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
    marginTop: 1,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },

  // ── Groups ──────────────────────────────────────────────────────────────────
  group: {
    marginBottom: 24,
  },
  groupHeader: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 0.9,
    marginBottom: 8,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  groupCardDanger: {
    backgroundColor: theme.colors.errorBg,
  },

  // ── Rows ────────────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubbleDanger: {
    backgroundColor: theme.colors.errorBg,
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontFamily: "Poppins-SemiBold",
  },
  rowLabelDanger: {
    color: theme.colors.errorFg,
  },
  rowSublabel: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontFamily: "Poppins",
    marginTop: 2,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  footerBar: {
    width: 36,
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 6,
  },
  footerText: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontFamily: "Poppins",
  },

  // ── Delete modal ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    elevation: 12,
    gap: 0,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Poppins",
    marginBottom: 24,
  },
  emailInput: {
    width: "100%",
    height: 50,
    borderWidth: 1.5,
    borderColor: theme.colors.brandBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Poppins",
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceAlt,
    marginBottom: 16,
  },
  modalSaveBtn: {
    width: "100%",
    backgroundColor: theme.colors.brand,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalSaveText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  modalDeleteBtn: {
    width: "100%",
    backgroundColor: theme.colors.errorFg,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalDeleteText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  modalCancelBtn: {
    paddingVertical: 8,
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontFamily: "Poppins",
    fontSize: 14,
  },
});
