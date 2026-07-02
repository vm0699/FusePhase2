# Fuse Explore — Phase 3 (Marketplace) Implementation Plan

> **Status:** ✅ ALL STAGES COMPLETE (Stages 0–7) — 2026-06-24
> This document is the cross-session source of truth. Update the Progress Log at the end of each stage.

---

## Context

Fuse Explore is the post-connection action layer added to Fuse in Phase 3.
It answers "what happens after people connect?" — gifts, date bookings, event tickets,
and premium concierge experiences, all from a District-inspired, Fuse-skinned marketplace tab.

The gift commerce engine (GiftCatalogItem, GiftOrder, GiftIntent, GiftPayment, giftEligibilityService,
giftPaymentProvider, adminAlertService, notificationService) already exists and is production-ready.
Explore reuses those shared services across new verticals (bookings, events, premium) without
touching the working gift flow.

### Key corrections to old CLAUDE.md notes (verified in code exploration)
- Gift backend is NOT "partial" — it is a finished payment-first MVP with full lifecycle, admin ops, address privacy, notifications, and a real GiftCatalogItem model with seed data.
- Video (`VideoInitiateScreen → WaitingScreen → vAgoraCallScreen`) is NOT a 1:1 per-match call — it is an Omegle-style random, interest-based matchmaking feature using Socket.io + Agora, open to all authenticated users. It stays as a primary bottom tab.

---

## Locked Product Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Name & prominence | **Fuse Explore**, primary bottom tab |
| 2 | Nav layout | Tabs: **Swipe · Liked You · Video · Explore · Chats**; Profile → tappable avatar in screen header |
| 3 | Access gating | Onboarded users browse anytime; match-linked actions need accepted chat + both-chatted |
| 4 | Gifts vs experiences | One Explore home; gifts are a category (reuse engine) |
| 5 | Geography | Chennai only, hardcoded (city field default "Chennai" as hedge) |
| 6 | Launch categories | Gifts, Date Bookings (cafes/restaurants), Event Tickets (local events), Premium (concierge request) |
| 7 | Booking model | Solo OR invite-a-match; sender pays; no split; invite expires 48h |
| 8 | Tiers/premium | LOW/MID gifts self-serve; HIGH → Premium concierge (admin confirms price before charge) |
| 9 | Date booking $ | Fuse booking/convenience fee (immediate revenue) + venue per-cover commission funds diner discount. No platform-funded discounts until commission deal exists. |
| 10 | Event tickets | Fuse resells curated local-event tickets via Razorpay, manual sourcing/forwarding |
| 11 | Monetization (first) | Margin + platform/convenience fee + delivery fee; booking fee; ticket margin |
| 12 | Architecture | New Explore models, reuse shared commerce services (gift flow untouched) |
| 13 | Ops alerts | WhatsApp via Twilio (real-time) + email (archive/fallback) + existing admin push |
| 14 | Payments | Razorpay TEST mode now; flip to live via config |
| 15 | Content mgmt | Seed scripts now + minimal protected admin web page soon |
| 16 | Analytics | In-house event log now (logEvent() + AnalyticsEvent); dashboard later |
| 17 | Event safety | Verified/onboarded only to purchase; gender-ratio/slot caps for future Fuse-hosted events |
| 18 | Video→match | Deferred this phase |
| 19 | Safety/privacy | All recommended safety defaults ON |

---

## Monetization Mechanics

- **Gifts:** Fuse margin + platform fee + delivery fee (already in GiftCatalogItem).
- **Date bookings:** Fuse booking/convenience fee per reservation (flat ₹). When venue commission deal exists, venue funds diner discount (15–25% venue, ~10% passed to diner, spread kept by Fuse). Never fund discounts from Fuse's own revenue.
- **Event tickets:** Buy/hold tickets and resell with margin, or negotiate organizer discount and keep the difference.
- **Premium:** admin-quoted price includes Fuse margin.

---

## Staged Implementation

### Stage 0 — Docs & scaffolding ✅
- FUSE_EXPLORE_PLAN.md in repo root
- CLAUDE.md pointer + corrections
- Auto-memory
- City constant + env placeholders

### Stage 1 — Commerce-core + Razorpay test + ops alerts
- Generalize shared services (payment, lifecycle, serializers, ops alerts, analytics)
- Wire Razorpay TEST mode end-to-end + RN checkout SDK
- opsAlertService: Twilio WhatsApp + email + push + protected admin action link
- logEvent() + AnalyticsEvent model
- **Done when:** gift purchase works on Razorpay test keys; ops alert fires WhatsApp+email; analytics recorded; gift regression passes.

### Stage 2 — Explore frontend shell + nav change
- Nav: 5 tabs (Swipe·Liked·Video·Explore·Chats), Profile → header avatar
- ExploreHomeScreen (District-inspired), ExploreCategoryScreen, ListingDetailScreen
- Nest existing gift screens under Explore
- Explore composite components (HeroCarousel, CategoryStrip, SectionRail, ListingCard, etc.)
- **Done when:** Explore tab navigable; gifts reachable inside Explore; Video still a tab; Profile via avatar.

### Stage 3 — Gifts in Explore + Premium request
- Gift catalog in Explore; chat "Plan a date" CTA stub
- PremiumRequest flow (model → ops alert → admin quote → pay → fulfil)
- HIGH tier routed to Premium
- **Done when:** gift purchase via Explore works; premium request reaches ops via WhatsApp/email.

### Stage 4 — Date Bookings (cafes/restaurants)
- Venue + Booking models; seed Chennai venues
- Solo or invite-match booking; 48h expiry; Razorpay test; venue-funded discount field (off by default)
- Cancel/reschedule; ops alert; status notifications
- **Done when:** solo booking + invite/accept/expiry all tested E2E.

### Stage 5 — Event Tickets (local events)
- Event + EventTicketOrder models; seed curated Chennai events
- Verified-only gate; Razorpay test; manual sourcing; ops alert; reminders
- **Done when:** verified user buys ticket (test); admin marks fulfilled; user sees confirmation.

### Stage 6 — Minimal protected admin web page
- List/filter orders/bookings/tickets; advance status; add notes; mark refund-required
- Basic add/edit venues & events
- **Done when:** ops can fulfil + manage content without a developer.

### Stage 7 — Safety, prefs, notifications, analytics finalize
- allowGifts/allowDateInvites prefs; report-creepy-gifting; invite rate limits
- All notification types + deep links; funnel instrumentation
- **Done when:** all safety rules enforced; funnel events recorded end-to-end.

---

## Critical File Map

### Backend — reuse/extend (do not break working gift flow)
- `FUSE - BE/api/models/GiftCatalogItem.js`
- `FUSE - BE/api/models/GiftOrder.js`
- `FUSE - BE/api/models/GiftIntentModel.js`
- `FUSE - BE/api/models/GiftPaymentModel.js`
- `FUSE - BE/api/services/giftPaymentProvider.js` → generalize to paymentProvider
- `FUSE - BE/api/services/adminAlertService.js` → generalize to opsAlertService
- `FUSE - BE/api/services/giftEligibilityService.js`
- `FUSE - BE/api/services/giftOrderService.js`
- `FUSE - BE/api/controllers/AdminGiftController.js`
- `FUSE - BE/api/routes/AdminGiftRoutes.js`
- `FUSE - BE/api/services/notifications/notificationTypes.js`
- `FUSE - BE/api/models/UserProfile.js`
- `FUSE - BE/server.js`

### Backend — new files
- `FUSE - BE/api/models/Venue.js`
- `FUSE - BE/api/models/Booking.js`
- `FUSE - BE/api/models/Event.js`
- `FUSE - BE/api/models/EventTicketOrder.js`
- `FUSE - BE/api/models/PremiumRequest.js`
- `FUSE - BE/api/models/AnalyticsEvent.js`
- `FUSE - BE/api/controllers/ExploreController.js`
- `FUSE - BE/api/controllers/BookingController.js`
- `FUSE - BE/api/controllers/EventController.js`
- `FUSE - BE/api/controllers/PremiumController.js`
- `FUSE - BE/api/routes/ExploreRoutes.js`
- `FUSE - BE/api/services/opsAlertService.js`
- `FUSE - BE/api/services/opsAlert/whatsapp.js`
- `FUSE - BE/api/services/opsAlert/email.js`
- `FUSE - BE/api/services/analytics/logEvent.js`
- `FUSE - BE/api/scripts/seedVenues.js`
- `FUSE - BE/api/scripts/seedEvents.js`

### Frontend — reuse/extend
- `fuse/app/navigation/MainTabs.js`
- `fuse/AppNav.js`
- `fuse/components/ui/BottomNav.tsx`
- `fuse/app/screens/ChatScreen.tsx`
- `fuse/app/notifications/notificationNavigation.ts`

### Frontend — new files
- `fuse/app/screens/ExploreHomeScreen.tsx`
- `fuse/app/screens/ExploreCategoryScreen.tsx`
- `fuse/app/screens/VenueDetailScreen.tsx`
- `fuse/app/screens/BookingCheckoutScreen.tsx` ✅
- `fuse/app/screens/MyBookingsScreen.tsx` ✅
- `fuse/app/screens/EventDetailScreen.tsx` ✅
- `fuse/app/screens/EventTicketCheckoutScreen.tsx` ✅
- `fuse/app/screens/MyTicketOrdersScreen.tsx` ✅
- `fuse/app/screens/PremiumRequestScreen.tsx` ✅
- `fuse/app/api/exploreApi.ts`
- `fuse/components/explore/HeroCarousel.tsx`
- `fuse/components/explore/CategoryStrip.tsx`
- `fuse/components/explore/SectionRail.tsx`
- `fuse/components/explore/ListingCard.tsx`
- `fuse/components/explore/VenueCard.tsx`
- `fuse/components/explore/EventCard.tsx`
- `fuse/components/explore/StickyCTABar.tsx`
- `fuse/components/explore/FilterChips.tsx`
- `fuse/components/explore/LocationChip.tsx`
- `fuse/components/explore/HeaderAvatar.tsx`

---

## UI/UX Direction (District-Inspired, Fuse-Skinned)

- Sticky top bar: location chip (📍 Chennai) + search field; collapses on scroll
- Hero carousel: full-bleed rounded banner cards, auto-scroll, page dots, brand-tinted gradient overlay
- Category strip: horizontal icon chips (Gifts, Date Bookings, Events, Premium, Coming soon greyed)
- Curated rails: horizontal scroll + "See all" with large image-forward cards
- Cards: image-top, radii.lg/xl, soft shadow, title + meta chips, brand pill tags
- Sticky bottom CTA bar: price/summary left, primary Button right (District conversion pattern)
- Bottom-sheet flows for date/time/party-size, quantity, invite-a-match, payment summary
- Skeletons everywhere while loading
- Colors/typography from app/theme/ only — no new palette; new theme tokens only if gap appears

---

## Safety Rules (always enforced)

- Recipient address/phone never shown to sender
- Users can disable gifts and date-invites (allowGifts, allowDateInvites prefs)
- Report creepy gifting action
- High-value/Premium → manual review always
- Rate-limit repeat gifts and invites
- Date venues = public, Fuse-verified only
- Ban: private/hotel-room, adult/sexual, alcohol-heavy, cash-equivalent listings
- Exact venue/event location revealed only after confirmation/payment
- Blocked/reported pair can't gift/invite each other

---

## Progress Log

| Stage | Status | Date | Notes |
|-------|--------|------|-------|
| Stage 0 | ✅ Complete | 2026-06-23 | Docs, scaffolding, env placeholders, memory written |
| Stage 1 | ✅ Complete | 2026-06-24 | All models, services, controllers, routes, exploreApi.ts, razorpayCheckout.ts, server.js mounted |
| Stage 2 | ✅ Complete | 2026-06-24 | Nav (5 tabs: Swipe·Liked·Video·Explore·Chats), Profile→HeaderAvatar, ExploreHomeScreen, ExploreCategoryScreen, VenueDetailScreen, EventDetailScreen, all Explore UI components |
| Stage 3 | ✅ Complete | 2026-06-24 | PremiumRequestScreen, gifts accessible from Explore → GiftCatalog |
| Stage 4 | ✅ Complete | 2026-06-24 | BookingCheckoutScreen (date/time/party-size, Razorpay, PLACEHOLDER), MyBookingsScreen (invite accept/decline, cancel, status) |
| Stage 5 | ✅ Complete | 2026-06-24 | EventTicketCheckoutScreen (quantity picker, Razorpay, PLACEHOLDER), MyTicketOrdersScreen (status, ticket ref, attachment link) |
| Stage 6 | ✅ Complete | 2026-06-24 | `FUSE - BE/public/admin/explore.html` — phone OTP login, Bookings/Tickets/Premium/Venues/Events tabs; status actions, notes, ticket refs, quote flow, venue/event CRUD |
| Stage 7 | ✅ Complete | 2026-06-24 | safetyPreferences (allowGifts, allowDateInvites) on UserProfile; eligibility enforcement in giftEligibilityService + BookingController; Explore notification types wired frontend + backend; notification deep links to MyBookings/MyTicketOrders/ExploreHome |
