import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function ChatInitiateScreen({ route }) {
  const navigation = useNavigation();
  const { recipientId, recipientName } = route.params || {};

  // Redacted: don't print route params (may contain user IDs/names)
  console.log("📌 ChatInitiateScreen mounted. Route params present:", !!route?.params);

  useEffect(() => {
    if (!recipientId || !recipientName) {
      // Redacted: avoid dumping params
      console.error("❌ ERROR: recipientId or recipientName is missing!");
    }
  }, []);

  if (!recipientId || !recipientName) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Error: Missing chat details</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Message cannot be empty.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "Session expired. Please log in again.");
        navigation.navigate("Login");
        return;
      }

      // Redacted: don't print recipientId/user identifiers
      console.log("📨 Sending message…");

      const response = await fetch("http://172.20.10.4:5000/api/chat/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: recipientId, message }),
      });

      const responseData = await response.json();

      if (response.ok) {
        Alert.alert("✅ Success", "Chat request sent successfully!");
        navigation.navigate("ChatListScreen");
      } else {
        Alert.alert("❌ Error", responseData.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      Alert.alert("Error", "An error occurred while sending the message.");
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
    backgroundColor: "#f9f9f9"
  },
  sendButton: { 
    backgroundColor: "#acb7ae", 
    padding: 15, 
    borderRadius: 5, 
    alignItems: "center" 
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 18 },
  backButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  }
});
