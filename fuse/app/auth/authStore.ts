import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "jwtToken";        // existing key in your app
const REFRESH_KEY = "refreshToken";   // new standard key
const ACCESS_EXP_KEY = "jwtTokenExp"; // store exp (ms) for quick checks

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpMs: number | null;
};

type AuthListener = () => void;

const listeners = new Set<AuthListener>();

function emitAuthChange() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.warn("authStore listener failed", error);
    }
  }
}

function safeParseNumber(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const authStore = {
  keys: { ACCESS_KEY, REFRESH_KEY, ACCESS_EXP_KEY },

  async getTokens(): Promise<StoredTokens> {
    const [accessToken, refreshToken, expStr] = await Promise.all([
      AsyncStorage.getItem(ACCESS_KEY),
      AsyncStorage.getItem(REFRESH_KEY),
      AsyncStorage.getItem(ACCESS_EXP_KEY),
    ]);

    return {
      accessToken,
      refreshToken,
      accessExpMs: safeParseNumber(expStr),
    };
  },

  async setTokens(args: { accessToken: string; refreshToken?: string | null; accessExpMs?: number | null }) {
    const ops: Promise<void>[] = [];
    ops.push(AsyncStorage.setItem(ACCESS_KEY, args.accessToken));

    // refreshToken is optional (but in production we always want it stored)
    if (typeof args.refreshToken !== "undefined") {
      if (args.refreshToken) ops.push(AsyncStorage.setItem(REFRESH_KEY, args.refreshToken));
      else ops.push(AsyncStorage.removeItem(REFRESH_KEY));
    }

    if (typeof args.accessExpMs !== "undefined") {
      if (args.accessExpMs) ops.push(AsyncStorage.setItem(ACCESS_EXP_KEY, String(args.accessExpMs)));
      else ops.push(AsyncStorage.removeItem(ACCESS_EXP_KEY));
    }

    await Promise.all(ops);
    emitAuthChange();
  },

  async clearAll() {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_KEY),
      AsyncStorage.removeItem(REFRESH_KEY),
      AsyncStorage.removeItem(ACCESS_EXP_KEY),
    ]);
    emitAuthChange();
  },

  subscribe(listener: AuthListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
