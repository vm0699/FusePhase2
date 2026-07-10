// fuse/app/api/exploreApi.ts
import { API_BASE_URL } from "../config/env";
import { authedFetch } from "../auth/apiClient";

const BASE_URL = API_BASE_URL;

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export type Venue = {
  _id: string;
  name: string;
  area: string;
  city: string;
  category: string;
  cuisine?: string;
  priceRange?: string;
  bookingFee: number;
  dinerDiscountPct: number;
  hasDiscount: boolean;
  images: string[];
  tags: string[];
  isFuseVerified: boolean;
  rating?: number;
  openingHours?: string;
  maxPartySize?: number;
  description?: string;
  interestTags?: string[];
  reviewCount?: number;
};

export type EventAudience = "DATE_IDEA" | "MEET_PEOPLE";
export type EventPricingType = "FREE_RSVP" | "PAID_EXTERNAL" | "PAID_FUSE";
export type EventRsvpStatus = "GOING" | "CANCELLED" | "CHECKED_IN";

export type Event = {
  _id: string;
  title: string;
  city: string;
  venue?: string;
  category: string;
  eventDate: string;
  images: string[];
  tags: string[];
  ticketPrice?: number;
  originalPrice?: number;
  savingsAmount: number;
  availableSlots: number | null;
  isSoldOut: boolean;
  isFeatured: boolean;
  agePolicy?: string;
  description?: string;
  dressCode?: string;
  importantInfo?: string;
  maxPerOrder?: number;
  eventEndDate?: string;
  // Iteration 2
  audience: EventAudience;
  pricingType: EventPricingType;
  organizer?: { name: string; instagram?: string };
  externalBookingUrl?: string;
  externalPrice?: string;
  rsvpCap: number | null;
  goingCount: number;
  myRsvp?: { status: EventRsvpStatus; showMeInCircle: boolean } | null;
  promoCode?: string;
};

export type EventRsvp = {
  _id: string;
  eventId: string;
  status: EventRsvpStatus;
  showMeInCircle: boolean;
  eventSnapshot: { title: string; eventDate: string; eventEndDate?: string };
  checkedInAt?: string | null;
  createdAt: string;
};

export type GiftSuggestion = {
  _id: string;
  name: string;
  tier: "LOW" | "MID";
  finalAmount: number;
  imageUrl: string;
  occasion?: string;
  category?: string;
};

export type ExploreMode = "dates" | "people";

export type ExploreHome = {
  // "dates" mode / legacy
  featuredVenues?: Venue[];
  upcomingEvents?: Event[];
  featuredEvents?: Event[];
  giftSuggestions?: GiftSuggestion[];
  // "people" mode
  myUpcomingEvents?: Event[];
  thisWeekend?: Event[];
  freeEvents?: Event[];
  featuredSocial?: Event[];
};

export type BookingStatus =
  | "CREATED"
  | "INVITE_PENDING"
  | "CONFIRMED"
  | "ADMIN_REVIEW"
  | "FULFILLED"
  | "CANCELLED"
  | "REFUND_REQUIRED"
  | "REFUNDED";

export type Booking = {
  _id: string;
  bookingCode: string;
  status: BookingStatus;
  venueId: string;
  venueSnapshot: {
    name: string;
    area: string;
    city: string;
    address: string | null; // null until CONFIRMED
    cuisine?: string;
    priceRange?: string;
    images?: string[];
  };
  bookingDate: string;
  partySize: number;
  bookingFee: number;
  totalAmount: number;
  inviteStatus?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | null;
  inviteExpiresAt?: string | null;
  invitedMatchName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketOrderStatus =
  | "CREATED"
  | "CONFIRMED"
  | "ADMIN_REVIEW"
  | "FULFILLED"
  | "CANCELLED"
  | "REFUND_REQUIRED"
  | "REFUNDED";

export type TicketOrder = {
  _id: string;
  ticketCode: string;
  status: TicketOrderStatus;
  eventTitle: string;
  eventVenue?: string;
  eventCity: string;
  eventAddress: string | null; // null until FULFILLED
  eventDate: string;
  quantity: number;
  totalAmount: number;
  ticketReference: string | null;
  ticketAttachment: string | null;
  createdAt: string;
};

export type PremiumRequest = {
  _id: string;
  status: string;
  occasion: string;
  budget: number;
  quotedAmount: number | null;
  quotedAt?: string;
  finalAmount?: number;
  createdAt: string;
};

export type PaymentInitResult = {
  paymentId: string;
  amount: number;
  currency: string;
  mode: "PLACEHOLDER" | "RAZORPAY";
  providerOrderId: string | null;
  keyId?: string | null;
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

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
    err.data = data;
    throw err;
  }
  return data;
}

async function patchJson(path: string, body?: any) {
  const res = await authedFetch({
    input: `${BASE_URL}${path}`,
    init: {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    },
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const err: any = new Error(data?.message || `Request failed (${res.status})`);
    err.data = data;
    throw err;
  }
  return data;
}

/* ─── API ─────────────────────────────────────────────────────────────────── */

export const exploreApi = {
  // ─── Home ─────────────────────────────────────────────────────────────────

  async getHome(mode?: ExploreMode): Promise<{ city: string; mode?: ExploreMode; defaultMode: ExploreMode; home: ExploreHome }> {
    const qs = mode ? `?mode=${mode}` : "";
    return getJson(`/api/explore/home${qs}`);
  },

  // ─── Venues ───────────────────────────────────────────────────────────────

  async getVenues(opts?: { category?: string; limit?: number; offset?: number }): Promise<{ venues: Venue[] }> {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.limit != null) params.set("limit", String(opts.limit));
    if (opts?.offset != null) params.set("offset", String(opts.offset));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return getJson(`/api/explore/venues${qs}`);
  },

  async getVenueDetail(venueId: string): Promise<{ venue: Venue }> {
    return getJson(`/api/explore/venues/${venueId}`);
  },

  // ─── Events ───────────────────────────────────────────────────────────────

  async getEvents(opts?: { category?: string; audience?: EventAudience; pricingType?: EventPricingType; limit?: number; offset?: number }): Promise<{ events: Event[] }> {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.audience) params.set("audience", opts.audience);
    if (opts?.pricingType) params.set("pricingType", opts.pricingType);
    if (opts?.limit != null) params.set("limit", String(opts.limit));
    if (opts?.offset != null) params.set("offset", String(opts.offset));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return getJson(`/api/explore/events${qs}`);
  },

  async getEventDetail(eventId: string): Promise<{ event: Event }> {
    return getJson(`/api/explore/events/${eventId}`);
  },

  // ─── Event Circle (RSVP / wave / check-in) ───────────────────────────────

  async rsvpEvent(eventId: string, showMeInCircle: boolean = true): Promise<{ rsvp: { status: EventRsvpStatus; showMeInCircle: boolean }; promoCode?: string }> {
    return postJson(`/api/explore/events/${eventId}/rsvp`, { showMeInCircle });
  },

  async cancelRsvp(eventId: string): Promise<{ success: boolean }> {
    return postJson(`/api/explore/events/${eventId}/rsvp/cancel`, {});
  },

  async updateRsvpVisibility(eventId: string, showMeInCircle: boolean): Promise<{ success: boolean }> {
    return patchJson(`/api/explore/events/${eventId}/rsvp`, { showMeInCircle });
  },

  async getMyEvents(): Promise<{
    upcoming: EventRsvp[];
    past: EventRsvp[];
    eventStats: { checkInCount: number; currentStreak: number; badges: string[] };
  }> {
    return getJson("/api/explore/my-events");
  },

  async getEventCircle(eventId: string): Promise<{
    hasAccess: boolean;
    teaser?: { goingCount: number; genderBalance: { men: number; women: number; other: number }; sharedInterestCount: number };
    attendees?: Array<{ userId: string; name: string; age: number | null; photo?: string; sharedInterestCount: number; waveStatus: "NONE" | "PENDING" | "MATCHED" }>;
  }> {
    return getJson(`/api/explore/events/${eventId}/circle`);
  },

  async waveAtAttendee(eventId: string, toUserId: string): Promise<{ isMatch: boolean; chatId?: string; otherUser?: { _id: string; name: string; photos: string[] } }> {
    return postJson(`/api/explore/events/${eventId}/wave`, { toUserId });
  },

  async checkInEvent(eventId: string, code: string): Promise<{ success: boolean; badgeEarned?: string }> {
    return postJson(`/api/explore/events/${eventId}/checkin`, { code });
  },

  // ─── Bookings ─────────────────────────────────────────────────────────────

  async createBooking(payload: {
    venueId: string;
    date: string;
    timeSlot: string;
    partySize: number;
    specialNotes?: string;
    inviteMatchId?: string;
  }): Promise<{ bookingId: string; status: string; inviteStatus?: string }> {
    return postJson("/api/explore/bookings", payload);
  },

  async initiateBookingPayment(bookingId: string): Promise<PaymentInitResult & { bookingId: string }> {
    return postJson(`/api/explore/bookings/${bookingId}/pay`);
  },

  async confirmBookingPayment(
    bookingId: string,
    payload: {
      paymentId: string;
      providerPaymentId?: string;
      signature?: string;
      status?: "failed";
    }
  ): Promise<{ bookingStatus: string }> {
    return postJson(`/api/explore/bookings/${bookingId}/pay/confirm`, payload);
  },

  async respondToBookingInvite(
    bookingId: string,
    action: "ACCEPT" | "DECLINE"
  ): Promise<{ inviteStatus: string }> {
    return postJson(`/api/explore/bookings/${bookingId}/invite-response`, { action });
  },

  async cancelBooking(bookingId: string): Promise<{ bookingStatus: string }> {
    return postJson(`/api/explore/bookings/${bookingId}/cancel`);
  },

  async getMyBookings(): Promise<{ bookings: Booking[] }> {
    return getJson("/api/explore/bookings");
  },

  async getBookingDetail(bookingId: string): Promise<{ booking: Booking }> {
    return getJson(`/api/explore/bookings/${bookingId}`);
  },

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async initiateTicketPurchase(payload: {
    eventId: string;
    quantity?: number;
  }): Promise<PaymentInitResult & { orderId: string }> {
    return postJson("/api/explore/tickets", payload);
  },

  async confirmTicketPayment(
    orderId: string,
    payload: {
      paymentId: string;
      providerPaymentId?: string;
      signature?: string;
      status?: "failed";
    }
  ): Promise<{ orderStatus: string; order: TicketOrder }> {
    return postJson(`/api/explore/tickets/${orderId}/pay/confirm`, payload);
  },

  async getMyTicketOrders(): Promise<{ orders: TicketOrder[] }> {
    return getJson("/api/explore/tickets");
  },

  async getTicketOrderDetail(orderId: string): Promise<{ order: TicketOrder }> {
    return getJson(`/api/explore/tickets/${orderId}`);
  },

  // ─── Premium ──────────────────────────────────────────────────────────────

  async submitPremiumRequest(payload: {
    occasion: string;
    budget: number;
    notes?: string;
    forMatchId?: string;
  }): Promise<{ requestId: string; message: string }> {
    return postJson("/api/explore/premium", payload);
  },

  async initiatePremiumPayment(requestId: string): Promise<PaymentInitResult & { paymentId: string }> {
    return postJson(`/api/explore/premium/${requestId}/pay`);
  },

  async confirmPremiumPayment(
    requestId: string,
    payload: {
      paymentId: string;
      providerPaymentId?: string;
      signature?: string;
      status?: "failed";
    }
  ): Promise<{ requestStatus: string }> {
    return postJson(`/api/explore/premium/${requestId}/pay/confirm`, payload);
  },

  async getMyPremiumRequests(): Promise<{ requests: PremiumRequest[] }> {
    return getJson("/api/explore/premium");
  },
};

export default exploreApi;
