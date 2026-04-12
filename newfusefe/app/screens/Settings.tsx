import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { Switch } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FusePopup } from "../../components/FusePopup";
import { authClient } from "../auth/authClient";
import { pushManager } from "../notifications/pushManager";

const BASE_URL = "http://172.20.10.4:5000";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      setUserLocation({ latitude, longitude });
      setLocationEnabled(true);

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
        () => navigation.reset({ index: 0, routes: [{ name: "Login" }] })
      );
    } catch (err) {
      showPopup("Error", "Could not delete your account. Please try again.", "error");
    } finally {
      setDeleting(false);
      setShowDeletePopup(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerPill}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Privacy, safety, and app preferences
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerPill}
          onPress={() => showPopup("Settings saved", "Your preferences were updated.", "success")}
        >
          <Text style={styles.headerDone}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Delivery Location - replaces toggle UI only */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("UpdateDeliveryLocation")}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Delivery location</Text>
              <Text style={styles.subText}>
                Update address for gifts, surprises, and future features.
              </Text>
            </View>
            <View style={styles.chevronBubble}>
              <Icon name="chevron-right" size={16} color="#6B7280" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Other Settings */}
        {[
          { title: "Video autoplay settings", route: "Video Autoplay" },
          { title: "Notification settings", route: "NotificationSettings" },
          { title: "Security and Privacy", route: "SecuritySettings" },
          { title: "Contact and FAQ", route: "Contact FAQ" },
        ].map((setting, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => setting.route && navigation.navigate(setting.route)}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{setting.title}</Text>
              <View style={styles.chevronBubble}>
                <Icon name="chevron-right" size={16} color="#6B7280" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Delete Account */}
        <TouchableOpacity
          onPress={() => setShowDeletePopup(true)}
          style={[styles.card, styles.deleteButton]}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBar}></View>
          <Text style={styles.footerText}>Version 5.392.0</Text>
          <Text style={styles.footerText}>Created with love.</Text>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={showDeletePopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wait. Leaving so soon?</Text>
            <Text style={styles.modalText}>
              Deleting your account will remove all chats, likes, and photos.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <Text style={styles.modalButtonText}>
                {deleting ? "Deleting..." : " Delete"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDeletePopup(false)}>
              <Text style={styles.modalCancelText}>No, I changed my mind</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
  },
  headerPill: {
    minWidth: 72,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  headerButton: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-SemiBold",
  },
  headerDone: {
    fontSize: 14,
    color: "#ff5864",
    fontFamily: "Poppins-Bold",
  },
  headerTitle: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Poppins",
    marginTop: 2,
  },
  scrollViewContent: { paddingBottom: 80 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  cardText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
    marginTop: 3,
  },
  subText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    lineHeight: 20,
    fontFamily: "Poppins",
  },
  chevronBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  deleteButton: { justifyContent: "center", alignItems: "center" },
  deleteText: {
    color: "#DC2626",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  footer: { alignItems: "center", marginTop: 16, paddingVertical: 16 },
  footerBar: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    marginBottom: 8,
  },
  footerText: { color: "#9CA3AF", fontSize: 12, fontFamily: "Poppins" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  modalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  modalButton: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 15,
  },
  modalCancelText: {
    color: "#6B7280",
    marginTop: 12,
    fontFamily: "Poppins",
    fontSize: 14,
  },
});
