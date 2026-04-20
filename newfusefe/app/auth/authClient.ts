import { authStore } from "./authStore";
import { API_BASE_URL } from "../config/env";

// ✅ Use the SAME BASE_URL you use in screens.
// If you already have a constants file, move BASE_URL there later.
const BASE_URL = API_BASE_URL;

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];

    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");

    const json = globalThis.atob ? globalThis.atob(padded) : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getExpMsFromJwt(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const expSec = payload?.exp;
  if (!expSec || typeof expSec !== "number") return null;
  return expSec * 1000;
}

function isExpired(expMs: number | null, skewMs = 30_000) {
  if (!expMs) return false; // if unknown, don't assume expired
  return Date.now() + skewMs >= expMs;
}

export const authClient = {
  BASE_URL,

  /**
   * Call backend refresh endpoint and rotate tokens.
   * Backend must accept refreshToken and return new accessToken + refreshToken.
   */
  async refreshWithToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success || !data?.data?.accessToken) {
      const msg = data?.message || `Refresh failed (${res.status})`;
      throw new Error(msg);
    }

    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  },

  /**
   * Returns a valid access token.
   * - If current access is valid: returns it.
   * - If expired/missing and refresh exists: refreshes and returns new access.
   * - If refresh missing/invalid: throws.
   */
  async getValidAccessToken(): Promise<string> {
    const { accessToken, refreshToken, accessExpMs } = await authStore.getTokens();

    const effectiveExp = accessExpMs ?? (accessToken ? getExpMsFromJwt(accessToken) : null);
    const hasValidAccess = accessToken && !isExpired(effectiveExp);

    if (hasValidAccess) {
      // store exp if we derived it for the first time
      if (!accessExpMs && effectiveExp) await authStore.setTokens({ accessToken, refreshToken: undefined, accessExpMs: effectiveExp });
      return accessToken;
    }

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const refreshed = await this.refreshWithToken(refreshToken);
    const newExp = getExpMsFromJwt(refreshed.accessToken);

    await authStore.setTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? refreshToken,
      accessExpMs: newExp,
    });

    return refreshed.accessToken;
  },

  /**
   * Bootstrap helper for AuthGate:
   * - returns { ok: true } if we can obtain a valid access token
   * - returns { ok: false } if we truly must go to Login
   */
  async bootstrap(): Promise<{ ok: true } | { ok: false; reason: string }> {
    try {
      await this.getValidAccessToken();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, reason: e?.message || "bootstrap_failed" };
    }
  },

  async logoutLocal() {
    await authStore.clearAll();
  },
};
