import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { FusePopup } from "../../components/FusePopup";
import { API_BASE_URL } from "../config/env";

export default function ChatInitiateScreen({ route }) {
  const navigation = useNavigation();
  const { recipientId, recipientName } = route.params || {};

  console.log("ChatInitiateScreen mounted. Route params present:", !!route?.params);

  useEffect(() => {
    if (!recipientId || !recipientName) {
      console.error("recipientId or recipientName is missing.");
    }
  }, [recipientId, recipientName]);

  const [message, setMessage] = useState("");
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

  if (!recipientId || !recipientName) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Missing chat details</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      showPopup("Error", "Message cannot be empty.", "error");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        showPopup("Error", "Session expired. Please log in again.", "error");
        navigation.navigate("Login");
        return;
      }

      console.log("Sending message...");

      const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId: recipientId, message }),
      });

      const responseData = await response.json();

      if (response.ok) {
        showPopup(
          "Request sent",
          "Chat request sent successfully.",
          "success",
          () => navigation.navigate("ChatListScreen")
        );
      } else {
        showPopup("Error", responseData.message || "Failed to send message.", "error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showPopup("Error", "An error occurred while sending the message.", "error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Chat with {recipientName}</Text>
      <TextInput
        style={styles.input}
        placeholder="Send a compliment..."
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
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
  container: { flex: 1, padding: 20, justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    backgroundColor: "#acb7ae",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 18 },
  backButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
});
