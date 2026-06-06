import RtmEngine from "agora-react-native-rtm";
import { chatApi, NormalizedMessage } from "../api/chatApi";

export class AgoraRealtime {
  private client: any = null;
  private channel: any = null;

  private channelId = "";
  private myUserId = "";
  private otherUserId = "";
  private onIncoming: (msg: NormalizedMessage & { _fromRealtime?: boolean }) => void = () => {};

  async connect(args: {
    channelSid: string;
    myUserId: string;
    otherUserId: string;
    onIncoming: (msg: NormalizedMessage & { _fromRealtime?: boolean }) => void;
  }) {
    const { channelSid, myUserId, otherUserId, onIncoming } = args;

    this.channelId = channelSid;
    this.myUserId = myUserId;
    this.otherUserId = otherUserId;
    this.onIncoming = onIncoming;

    // 1️⃣ Fetch RTM token from backend
    const tokenRes = await fetch(`${chatApi.BASE_URL}/api/agora/rtm-token`, {
      headers: await chatApi["authHeaders"](),
    });

    const { token, appId } = await tokenRes.json();

    // 2️⃣ Create RTM client (CORRECT way)
    this.client = RtmEngine({
  appId: process.env.EXPO_PUBLIC_AGORA_APP_ID!,
});

await this.client.login({
  uid: this.myUserId,
  token,
});

this.channel = this.client.createChannel(this.channelId);
await this.channel.join();

    // 5️⃣ Listen for messages
    this.channel.on("ChannelMessage", (message: any, memberId: string) => {
  const normalized: NormalizedMessage & { _fromRealtime?: boolean } = {
    id: `rt-${Date.now()}`,
    authorId: memberId === this.myUserId ? this.myUserId : this.otherUserId,
    body: message.text,
    timestamp: new Date().toISOString(),
    _fromRealtime: true,
  };

  this.onIncoming(normalized);
});

  }

  async send(text: string) {
    if (!this.channel) {
      throw new Error("Agora channel not connected");
    }

    await this.channel.sendMessage({ text });
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.leave();
      }
      if (this.client) {
        await this.client.logout();
        await this.client.release();
      }
    } finally {
      this.channel = null;
      this.client = null;
    }
  }
}
