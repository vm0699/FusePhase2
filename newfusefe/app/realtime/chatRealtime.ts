import { Client as TwilioChatClient } from "twilio-chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatApi, NormalizedMessage } from "../api/chatApi";

export type RealtimeProvider = "twilio" | "agora";

export type RealtimeIncomingHandler = (
  msg: NormalizedMessage & {
    _fromRealtime?: boolean;
    _twilioSid?: string;
  }
) => void;

export type RealtimeClient = {
  connect(args: {
    provider?: RealtimeProvider;
    channelSid: string;
    myUserId: string;
    myUsername?: string;
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
  private myUserId = "";
  private myIdentity = "";
  private myUsername = "";
  private otherUserId = "";
  private onIncoming: RealtimeIncomingHandler = () => {};
  private messageListener: ((message: any) => void) | null = null;
  private tokenAboutToExpireListener: (() => void) | null = null;
  private tokenExpiredListener: (() => void) | null = null;
  private isRefreshingToken = false;

  private async refreshToken() {
    if (!this.twilioClient || this.isRefreshingToken) return;
    this.isRefreshingToken = true;
    try {
      const { token, identity } = await chatApi.getTwilioToken();
      if (identity) {
        this.myIdentity = identity;
      }
      await this.twilioClient.updateToken(token);
    } finally {
      this.isRefreshingToken = false;
    }
  }

  async connect(args: {
    channelSid: string;
    myUserId: string;
    myUsername?: string;
    otherUserId: string;
    otherUsername?: string;
    onIncoming: RealtimeIncomingHandler;
  }) {
    this.channelSid = args.channelSid;
    this.myUserId = args.myUserId;
    this.myUsername = args.myUsername || "";
    this.otherUserId = args.otherUserId;
    this.onIncoming = args.onIncoming;

    const { token, identity } = await chatApi.getTwilioToken();
    this.myIdentity = identity || this.myUserId;

    this.twilioClient = await TwilioChatClient.create(token);
    this.channel = await this.twilioClient.getChannelBySid(this.channelSid);

    if (this.channel.status !== "joined") {
      await this.channel.join();
    }

    this.messageListener = (twilioMessage: any) => {
      const author = (twilioMessage.author || "").toString();
      const myIdentity = (this.myIdentity || this.myUserId || "").toString();
      const isMine =
        author === myIdentity ||
        author === this.myUserId ||
        (this.myUsername.length > 0 &&
          author.toLowerCase() === this.myUsername.toLowerCase());

      const normalized: NormalizedMessage & {
        _fromRealtime?: boolean;
        _twilioSid?: string;
      } = {
        id: `rt-${twilioMessage.sid}`,
        authorId: isMine ? this.myUserId : this.otherUserId,
        body: twilioMessage.body,
        timestamp: twilioMessage.dateCreated
          ? new Date(twilioMessage.dateCreated).toISOString()
          : new Date().toISOString(),
        _fromRealtime: true,
        _twilioSid: twilioMessage.sid,
      };

      this.onIncoming(normalized);
    };

    this.channel.on("messageAdded", this.messageListener);

    this.tokenAboutToExpireListener = () => {
      void this.refreshToken();
    };
    this.tokenExpiredListener = () => {
      void this.refreshToken();
    };

    this.twilioClient.on("tokenAboutToExpire", this.tokenAboutToExpireListener);
    this.twilioClient.on("tokenExpired", this.tokenExpiredListener);
  }

  async send(text: string) {
    if (!this.channel) throw new Error("Twilio channel not connected");
    await this.channel.sendMessage(text);
  }

  async disconnect() {
    try {
      if (this.channel && this.messageListener) {
        this.channel.removeListener("messageAdded", this.messageListener);
      }
      if (this.twilioClient && this.tokenAboutToExpireListener) {
        this.twilioClient.removeListener(
          "tokenAboutToExpire",
          this.tokenAboutToExpireListener
        );
      }
      if (this.twilioClient && this.tokenExpiredListener) {
        this.twilioClient.removeListener("tokenExpired", this.tokenExpiredListener);
      }
      if (this.twilioClient) {
        this.twilioClient.shutdown();
      }
    } finally {
      this.twilioClient = null;
      this.channel = null;
      this.channelSid = null;
      this.myIdentity = "";
      this.messageListener = null;
      this.tokenAboutToExpireListener = null;
      this.tokenExpiredListener = null;
      this.isRefreshingToken = false;
    }
  }
}

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

export function createChatRealtime(
  provider: RealtimeProvider = "twilio"
): RealtimeClient {
  if (provider === "agora") return new AgoraRealtime();
  return new TwilioRealtime();
}

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
