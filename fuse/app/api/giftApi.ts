// fuse/app/api/giftApi.ts
import { API_BASE_URL } from "../config/env";
import { authedFetch } from "../auth/apiClient";

const BASE_URL = API_BASE_URL;

/* ----------------------------- Types ----------------------------- */

export type GiftTier = "LOW" | "MID";

export type GiftEligibility = {
  eligible: boolean;
  reason: string | null;
  chatStatus: string | null;
  bothUsersChatted: boolean;
  activeOrderExists: boolean;
  recipientId?: string | null;
  limits: {
    low: { canSend: boolean; reason: string | null };
    mid: { canSend: boolean; reason: string | null };
  };
};

export type GiftCatalogItem = {
  itemId: string;
  name: string;
  description: string;
  tier: GiftTier;
  imageUrl: string;
  category: string;
  occasion: string;
  amount: number;
  currency: string;
};

export type GiftCatalog = {
  catalog: { low: GiftCatalogItem[]; mid: GiftCatalogItem[] };
  suggested: GiftCatalogItem[];
};

export type GiftOrderView = {
  orderId: string;
  orderCode: string | null;
  intentId: string | null;
  chatId: string;
  tier: GiftTier | null;
  totalAmount: number;
  currency: string;
  status: string;
  statusLabel: string;
  perspective: "SENDER" | "RECIPIENT";
  canDecline: boolean;
  items: Array<{ itemId?: string; name?: string; quantity?: number; price?: number }>;
  tracking: Record<string, any>;
  delivery: { city: string | null; state: string | null; label: string | null };
  counterpart: { id?: string | null; name?: string; username?: string; photo?: string | null };
  createdAt: string;
  updatedAt: string;
};

/* --------------------------- Helpers ----------------------------- */

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function getJson(path: string) {
  const res = await authedFetch({ input: `${BASE_URL}${path}`, init: { method: "GET" } });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

async function postJson(path: string, body?: any) {
  const res = await authedFetch({
    input: `${BASE_URL}${path}`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const err: any = new Error(data?.message || `Request failed (${res.status})`);
    err.reason = data?.reason;
    err.data = data;
    throw err;
  }
  return data;
}

/* ----------------------------- API ------------------------------- */

export const giftApi = {
  BASE_URL,

  async getEligibility(chatId: string): Promise<GiftEligibility> {
    const data = await getJson(`/api/chat/${chatId}/gift/eligibility`);
    return data as GiftEligibility;
  },

  async getCatalog(opts?: { chatId?: string; recipientId?: string }): Promise<GiftCatalog> {
    const params = new URLSearchParams();
    if (opts?.chatId) params.set("chatId", opts.chatId);
    if (opts?.recipientId) params.set("recipientId", opts.recipientId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await getJson(`/api/gifts/catalog${qs}`);
    return { catalog: data?.catalog || { low: [], mid: [] }, suggested: data?.suggested || [] };
  },

  async getCatalogItem(itemId: string): Promise<GiftCatalogItem> {
    const data = await getJson(`/api/gifts/catalog/${itemId}`);
    return data?.item as GiftCatalogItem;
  },

  async createIntent(
    chatId: string,
    payload: { catalogItemId: string; quantity?: number }
  ): Promise<{
    giftIntentId: string;
    intent: any;
    amountBreakdown: { total: number; currency: string };
  }> {
    return postJson(`/api/chat/${chatId}/gift-intent`, payload);
  },

  async getIntent(intentId: string): Promise<any> {
    const data = await getJson(`/api/chat/gift-intent/${intentId}`);
    return data?.intent;
  },

  async initiatePayment(intentId: string): Promise<{
    paymentId: string;
    amount: number;
    currency: string;
    mode: "PLACEHOLDER" | "RAZORPAY";
    providerOrderId: string | null;
    razorpayKeyId?: string | null;
    alreadyPaid?: boolean;
  }> {
    return postJson(`/api/chat/gift-intent/${intentId}/pay`);
  },

  async confirmPayment(
    intentId: string,
    payload: {
      paymentId: string;
      providerPaymentId?: string;
      signature?: string;
      status?: "PAID" | "FAILED";
      failureReason?: string;
    }
  ): Promise<{ order: { _id: string; orderCode: string; status: string } | null }> {
    return postJson(`/api/chat/gift-intent/${intentId}/pay/confirm`, payload);
  },

  async getOrder(orderId: string): Promise<GiftOrderView> {
    const data = await getJson(`/api/chat/gifts/order/${orderId}`);
    return data?.order as GiftOrderView;
  },

  async getSentGifts(page = 1): Promise<{ orders: GiftOrderView[]; total: number; totalPages: number }> {
    const data = await getJson(`/api/chat/gifts/sent?page=${page}`);
    return { orders: data?.orders || [], total: data?.total || 0, totalPages: data?.totalPages || 1 };
  },

  async getReceivedGifts(page = 1): Promise<{ orders: GiftOrderView[]; total: number; totalPages: number }> {
    const data = await getJson(`/api/chat/gifts/received?page=${page}`);
    return { orders: data?.orders || [], total: data?.total || 0, totalPages: data?.totalPages || 1 };
  },

  async declineOrder(orderId: string): Promise<{ status: string }> {
    return postJson(`/api/gifts/orders/${orderId}/decline`);
  },
};

export default giftApi;
