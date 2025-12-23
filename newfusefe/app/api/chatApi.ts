// newfusefe/app/api/chatApi.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://172.20.10.4:5000";

type ChatListItem = {
  _id?: string;
  chatId?: string;
  status?: "pending" | "accepted" | "rejected" | "closed";
  twilioChatChannelSid?: string;
  twilioChannelSid?: string;
  actualReceiverId?: string;
  complimentPreview?: string | null;
  user?: { id: string; name?: string; username?: string; photos?: string[] };
};

export type NormalizedMessage = {
  id: string;
  authorId: string;
  body: string;
  timestamp: string;

  // 🔹 migration-safe metadata
  _fromRealtime?: boolean;
  _fromDB?: boolean;
  _twilioSid?: string;
};

async function authHeaders(extra?: Record<string, string>) {
  const jwtToken = await AsyncStorage.getItem("jwtToken");
  if (!jwtToken) throw new Error("Missing jwtToken");
  return {
    Authorization: `Bearer ${jwtToken}`,
    ...(extra || {}),
  };
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const chatApi = {
  BASE_URL,

  async listChats(): Promise<ChatListItem[]> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/api/chat/list`, { method: "GET", headers });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || `Failed to fetch chat list (${res.status})`);
    }

    const chats = data?.chats || [];
    // match your existing ChatListScreen normalization
    return chats.map((c: ChatListItem) => ({
      ...c,
      chatId: c.chatId || c._id,
      status: c.status || "pending",
      twilioChatChannelSid: c.twilioChatChannelSid || c.twilioChannelSid,
    }));
  },

  async getTwilioToken(): Promise<string> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/api/chat/twilio-token`, { method: "GET", headers });

    const data = await safeJson(res);
    if (!res.ok || !data?.token) {
      throw new Error(data?.message || "Failed to fetch Twilio token");
    }
    return data.token;
  },

  async acceptChat(chatId: string): Promise<{
    status: "accepted";
    twilioChannelSid?: string;
    showMatchedBanner?: boolean;
  }> {
    const headers = await authHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${BASE_URL}/api/chat/handle-chat-request`, {
      method: "POST",
      headers,
      body: JSON.stringify({ chatId, action: "accept" }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to accept chat");
    }
    return data;
  },

  async rejectChat(chatId: string): Promise<{ status: "rejected" }> {
    const headers = await authHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${BASE_URL}/api/chat/handle-chat-request`, {
      method: "POST",
      headers,
      body: JSON.stringify({ chatId, action: "reject" }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to reject chat");
    }
    return data;
  },

  async fetchHistory(chatId: string): Promise<NormalizedMessage[]> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/api/chat/${chatId}/messages`, { headers });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch chat history");
    }

    const msgs = data?.messages || [];
    return msgs.map((m: any) => ({
      id: m.id,
      authorId: m.authorId ?? null,
      body: m.body,
      timestamp: m.timestamp,
    }));
  },

  async persistMessage(chatId: string, message: string): Promise<void> {
    const headers = await authHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${BASE_URL}/api/chat/${chatId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.message || "Failed to persist message");
    }
  },
};
