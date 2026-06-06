import { authClient } from "./authClient";
import { authStore } from "./authStore";

type FetchArgs = {
  input: string;
  init?: RequestInit;
};

export async function authedFetch({ input, init }: FetchArgs): Promise<Response> {
  // 1) ensure access token
  const token = await authClient.getValidAccessToken();

  const headers = new Headers(init?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  // If JSON request and caller didn't set Content-Type, leave it alone
  const firstRes = await fetch(input, { ...(init || {}), headers });

  // 2) If unauthorized, attempt ONE refresh and retry once
  if (firstRes.status === 401 || firstRes.status === 403) {
    // try refresh only if refreshToken exists
    const { refreshToken } = await authStore.getTokens();
    if (!refreshToken) return firstRes;

    try {
      await authClient.getValidAccessToken(); // this triggers refresh if needed
      const newToken = (await authStore.getTokens()).accessToken;
      if (!newToken) return firstRes;

      const retryHeaders = new Headers(init?.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);

      return await fetch(input, { ...(init || {}), headers: retryHeaders });
    } catch {
      return firstRes;
    }
  }

  return firstRes;
}
