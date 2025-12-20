// newfusefe/app/realtime/chatRealtime.ts
import { Client as TwilioChatClient } from "twilio-chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatApi, NormalizedMessage } from "../api/chatApi";

// Toggle provider safely without breaking builds.
// For now keep it "twilio". Later we’ll switch to "agora" once backend + SDK is ready.
export type RealtimeProvider = "twilio" | "agora";

export type RealtimeIncomingHandler = (msg: NormalizedMessage & {
  _fromRealtime?: boolean;
  _twilioSid?: string;
}) => void;

export type RealtimeClient = {
  connect(args: {
    provider?: RealtimeProvider;
    channelSid: string;
    myUserId: string;
    myUsername: string; // Twilio identity is username (backend uses req.user.username)
    otherUserId: string;
    otherUsername?: string;
    onIncoming: RealtimeIncomingHandler;
  }): Promise<void>;

  send(text: string): Promise<void>;
  disconnect(): Promise<void>;
};

class TwilioRealtime implements RealtimeClient {
  private twilioClient: any = null;
  private channel: any = null;
  private channelSid: string | null = null;
  private myUserId: string = "";
  private myUsername: string = "";
  private otherUserId: string = "";
  private otherUsername: string = "";
  private onIncoming: RealtimeIncomingHandler = () => {};

  async connect(args: {
    channelSid: string;
    myUserId: string;
    myUsername: string;
    otherUserId: string;
    otherUsername?: string;
    onIncoming: RealtimeIncomingHandler;
  }) {
    this.channelSid = args.channelSid;
    this.myUserId = args.myUserId;
    this.myUsername = args.myUsername;
    this.otherUserId = args.otherUserId;
    this.otherUsername = args.otherUsername || "User";
    this.onIncoming = args.onIncoming;

    const token = await chatApi.getTwilioToken();

    this.twilioClient = await TwilioChatClient.create(token);
    this.channel = await this.twilioClient.getChannelBySid(this.channelSid);

    if (this.channel.status !== "joined") {
      await this.channel.join();
    }

    this.channel.on("messageAdded", (twilioMessage: any) => {
      // Normalize Twilio message → your UI shape
      const normalized: NormalizedMessage & { _fromRealtime?: boolean; _twilioSid?: string } = {
        id: `rt-${twilioMessage.sid}`,
        authorId:
          (twilioMessage.author || "").toLowerCase() === (this.myUsername || "").toLowerCase()
            ? this.myUserId
            : this.otherUserId,
        body: twilioMessage.body,
        timestamp: new Date().toISOString(),
        _fromRealtime: true,
        _twilioSid: twilioMessage.sid,
      };

      this.onIncoming(normalized);
    });
  }

  async send(text: string) {
    if (!this.channel) throw new Error("Twilio channel not connected");
    await this.channel.sendMessage(text);
  }

  async disconnect() {
    try {
      if (this.twilioClient) {
        this.twilioClient.shutdown();
      }
    } finally {
      this.twilioClient = null;
      this.channel = null;
      this.channelSid = null;
    }
  }
}

/**
 * Agora provider (Phase 4) — placeholder that does NOT break your build.
 * We will implement for real after:
 *  - backend endpoint for Agora RTM token (or message relay)
 *  - RN SDK added (Agora RTM / RTM2) and tested
 */
class AgoraRealtime implements RealtimeClient {
  async connect() {
    throw new Error(
      "Agora realtime is not enabled yet. Phase 4 next step: add backend Agora token endpoint + install Agora RTM SDK."
    );
  }
  async send() {
    throw new Error("Agora realtime is not enabled yet.");
  }
  async disconnect() {
    return;
  }
}

export function createChatRealtime(provider: RealtimeProvider = "twilio"): RealtimeClient {
  if (provider === "agora") return new AgoraRealtime();
  return new TwilioRealtime();
}

// Optional: store provider preference (so you can enable Agora per-build/per-user later)
const PROVIDER_KEY = "chatRealtimeProvider";

export const chatRealtimeProviderStore = {
  async get(): Promise<RealtimeProvider> {
    const v = await AsyncStorage.getItem(PROVIDER_KEY);
    if (v === "agora" || v === "twilio") return v;
    return "twilio";
  },
  async set(p: RealtimeProvider) {
    await AsyncStorage.setItem(PROVIDER_KEY, p);
  },
};
