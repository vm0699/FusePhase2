import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/env";

export const sendSwipeAction = async (swipedUserId: string, action: "like" | "dislike") => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      console.error("No auth token found!");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/profile/swipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ swipedUserId, action }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error sending swipe action:", error);
  }
};
