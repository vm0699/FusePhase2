import { authedFetch } from "../auth/apiClient";
import { authClient } from "../auth/authClient";

type RegisterArgs = {
  pushToken: string;
  platform: string;
  deviceId: string;
  provider?: string;
  metadata?: Record<string, any>;
};

type UnregisterArgs = {
  pushToken?: string | null;
  deviceId?: string | null;
  provider?: string;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const notificationApi = {
  async registerToken(args: RegisterArgs) {
    console.log("[notifications] POST /api/notifications/register-token", {
      platform: args.platform,
      deviceId: args.deviceId,
      provider: args.provider || "EXPO",
      pushTokenPreview: `${args.pushToken.slice(0, 12)}...`,
    });

    const res = await authedFetch({
      input: `${authClient.BASE_URL}/api/notifications/register-token`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      },
    });

    const data = await safeJson(res);
    console.log("[notifications] register-token response", {
      status: res.status,
      ok: res.ok,
      body: data,
    });
    if (!res.ok) {
      throw new Error(data?.message || "Failed to register push token");
    }

    return data;
  },

  async unregisterToken(args: UnregisterArgs) {
    console.log("[notifications] POST /api/notifications/unregister-token", {
      deviceId: args.deviceId || null,
      provider: args.provider || "EXPO",
      pushTokenPreview: args.pushToken ? `${args.pushToken.slice(0, 12)}...` : null,
    });

    const res = await authedFetch({
      input: `${authClient.BASE_URL}/api/notifications/unregister-token`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      },
    });

    const data = await safeJson(res);
    console.log("[notifications] unregister-token response", {
      status: res.status,
      ok: res.ok,
      body: data,
    });
    if (!res.ok) {
      throw new Error(data?.message || "Failed to unregister push token");
    }

    return data;
  },
};
