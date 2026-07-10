# Fuse Explore — Iteration 2: Social Events Layer + Segmented Explore

> **Status:** ✅ ALL STAGES COMPLETE (Stages A–G) — 2026-07-03. Companion to `FUSE_EXPLORE_PLAN.md` (Phase 3, all stages complete).
> This document is the cross-session source of truth for Explore Iteration 2. Update the Progress Log at the end of each stage.

---

## Context

Explore Phase 3 (marketplace: gifts, date bookings, event tickets, premium concierge) is code-complete but was built as a **revenue marketplace** — which needs liquidity Fuse won't have at <1000 users (no venue collabs, no investment, ~20 users today, Phase A "Founding 100" active per `FUSE_MARKETING_PLAN.md`).

This iteration repositions Explore for cold-start: **Fuse becomes the social layer on top of Chennai's existing events** — run clubs, house parties, gigs, stranger meetups — rather than a ticket inventory. Organizers get free promotion + customers; Fuse gets listings for free, brand presence at real events, and its killer differentiator: *who else from Fuse is going*.

### Locked product decisions (user-confirmed 2026-07-02)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Pricing model | Free events → free RSVP in-app. Paid events → listed with organizer's booking info + optional Fuse promo code/offer. Fuse = all-in-one app for dating culture + meetups: swipe → chat → gift → book → go out. |
| 2 | Social layer | Full "Event Circle": attendees who joined via Fuse see each other and can connect, with a detailed visibility ladder + a separate event-based matching option in discovery. |
| 3 | Supply | Stage 1 = Fuse manually lists events after organizer's green light (Fuse is an add-on/promotion channel for the organizer). Stage 2 (later) = organizer self-serve portal. Fuse users who RSVP through Fuse get an in-app network + perks. |
| 4 | UI | Segmented Explore tab — one tab, top-level toggle: "Date Ideas" vs "Meet People". Default mode picked by whether the user has active matches. |

---

## Part 1 — Strategy: how the marketplace scales with 0 collabs, 0 investment

### The cold-start inversion
A marketplace needs supply liquidity + demand liquidity. Fuse has neither — so Explore v2 doesn't sell inventory, it **aggregates what already exists**:

- **Supply costs nothing to acquire.** A run club or open-mic organizer says yes to a free listing because it is free promotion. No commission negotiation, no contract, no ops burden. The pitch to organizers: "We put your event in front of Chennai's most socially active 21–30 crowd, free. They RSVP through us; you get attendees. If you want, give our users a small code/offer."
- **Demand needs only ~5 users per event.** The product isn't the ticket (they can get that anywhere); it's the *Fuse circle at the event* — even 5 Fuse people at a 60-person run club creates the "I didn't come alone" experience.
- **Each listing is a distribution channel.** Organizers announce "RSVP on Fuse for the offer" to their existing community → their audience discovers Fuse. This is user acquisition that costs ₹0 and lands exactly the target persona (socially active, goes out, Chennai).

### Differentiation ("why not Hinge / District?")

| App | What it is | What it lacks |
|---|---|---|
| Hinge/Bumble/Tinder | Matching + chat | Ends at chat. No real-world layer, no group anything. |
| District / Insider / BookMyShow | Ticket inventory | Zero social graph. You book and go alone. |
| Timeleft / 222-style | Curated stranger dinners | No dating layer, expensive, no local event breadth. |
| **Fuse** | **Chennai's plans + the people in them** | — |

One-liner evolution: *"Chennai's dating app that gets you off the app"* → **"Match. Gift. Go out — together or with the city."** Dates for your matches; run clubs, parties and meetups for everyone else. Nobody goes alone.

### How ads/perception connect pre-traction
- The social layer **is** the ad: "POV: you joined a Saturday run club through Fuse and there were 6 other Fuse people there" is a reel Hinge and District structurally cannot make.
- Event listings give the IG account an endless stream of *local-utility save-bait* ("This weekend in Chennai — 5 things + who's going").
- Every organizer green-light = a cross-promo partner from day 1 (their story mentions Fuse).
- The Founding-100 perk becomes concrete: early access to event circles + event promo codes.
- Female-first strategy fit: group meetups (run club, board-game night) are a far lower-stakes entry point for women than 1:1 swiping — "come for the run club, stay for the dating app."

---

## Part 2 — "Fuse Circle" social layer: detailed design

The unit of the social layer is the **Event Circle**: the set of Fuse users who RSVP'd/booked a given event through Fuse. Everything below defines who sees what, when.

### 2.1 Event types & pricing (supply model)

| `pricingType` | Behavior in app | Example |
|---|---|---|
| `FREE_RSVP` | One-tap RSVP inside Fuse. No payment. | Run club, beach cleanup, board-game meetup |
| `PAID_EXTERNAL` | Listed with organizer's booking link/instructions + optional **Fuse promo code** shown after RSVP ("I'm going"). Fuse doesn't process payment. | Comedy show ticketed on Insider; organizer gives Fuse users 10% code |
| `PAID_FUSE` | Existing Razorpay ticket flow (unchanged). Used when organizer lets Fuse sell directly or for Fuse-hosted events. | Fuse mixer, small curated events |

Key insight: in all three cases the user taps **"I'm going"** in Fuse → they enter the Event Circle. For `PAID_EXTERNAL`, the RSVP is what unlocks the promo code — so booking outside Fuse still routes the *social* action through Fuse. That's the aggregator moat: District owns the ticket, Fuse owns the circle.

### 2.2 Audience segmentation

New `audience` field on Event: `MEET_PEOPLE` (run clubs, parties, meetups — shown in "Meet People" mode, open to every onboarded user) vs `DATE_IDEA` (couple-friendly events shown in "Date Ideas" mode, bookable with invite-a-match).

### 2.3 Who sees what, when (visibility ladder)

| Stage | What's visible | To whom |
|---|---|---|
| **Browsing** (before RSVP) | Circle teaser only: "🔥 14 from Fuse going · balanced group · 3 share your interests". No names, no photos. | Any onboarded user |
| **After RSVP** | Attendee grid: first name, age, one photo, shared-interest chips, mutual-event count ("2nd event together"). No bio, no full profile, no photos beyond the first. | Circle members who kept `showMeInCircle` ON |
| **Wave sent** (like from circle) | Standard pending state; recipient sees it in Liked You with event badge "Going to Marina Run Club too" | The waved-at user |
| **Mutual wave** | Full profiles + chat opens (reuses existing Like → match → chat machinery, with `source: "event_wave"`) | Both users |
| **After event** (48h window) | "From <event>" rail/boost in discovery for **checked-in** attendees only; badge "You were both at X" | Checked-in circle members |
| **After 48h** | Circle dissolves into normal discovery; event history stays on your own profile as "Been to" chips (optional) | — |

Privacy/safety controls:
- `showMeInCircle` toggle per-RSVP (default ON, prompted at first RSVP; sits alongside existing `safetyPreferences.allowGifts/allowDateInvites`).
- Blocked/reported pairs never appear in each other's circle views (reuse existing Block model check, same as gifting).
- Women-first guardrail: circle teaser shows gender balance so women can judge the room before RSVPing; if a circle is heavily male, show "mostly guys so far" honestly — trust > vanity.
- Anti-lurker rules: attendee grid requires an active RSVP (cancelling removes access immediately); RSVP rate-limit (max 5 active RSVPs / 3 per day); waves per event capped at 3; report action directly on circle cards.

### 2.4 Attendance check-in (what gates post-event matching)

RSVP ≠ attended. Post-event matching is the reward for actually showing up:
- MVP: **event code check-in** — organizer (or Fuse rep) shares a 4-digit code at the venue; user enters it in the event screen during the event time-window. Optionally geo-assisted (lat/lng within ~500 m) as a soft signal, not a hard gate (GPS at indoor venues is flaky).
- Checked-in users unlock: the 48h "From <event>" post-event boost, the "Been to" profile chip, and count toward mutual-event streaks.
- No-shows keep nothing — this kills the "RSVP to browse profiles" exploit.

### 2.5 Event-based matching mode

A discovery preference, not a separate tab:
- New toggle in FilterScreen / discovery prefs: **"People who go out"** modes — `Everyone` (default) / `Event-goers` (people with ≥1 checked-in event) / `My circles` (people who share an upcoming or past event circle with you).
- In the swipe deck, shared-event context becomes a ranking signal + card chip ("You were both at Sunrise Run Club") — plugs into the existing `scoreAndRankCandidates()` scoring in ProfileController as an additive score, and into the card's context labels.
- This makes attending events improve your dating odds — the flywheel: go out → get seen more → match more → go out again.

### 2.6 Perks for booking through Fuse

1. **Promo codes** (organizer-funded offer, shown post-RSVP).
2. **Circle access** (see + connect with attendees) — the core perk.
3. **Event streaks / "Fuse Regular" badge** — 3 check-ins = badge; regulars get early access to capped Fuse-hosted events. Cheap to build, drives repeat attendance, status mechanic for marketing ("Founding 100 + Regulars first").
4. **Squad RSVP** (later stage): RSVP with a friend via referral link — friend installs Fuse to join your RSVP → viral loop tied to real plans.

### 2.7 Organizer pipeline (supply ops)

- **Stage 1 (now):** Founder DMs/meets Chennai organizers (run clubs, board-game cafés, open-mic hosts, college fest teams). Green light = admin adds listing via `explore.html` admin page (extended with new fields). Organizer gets: free listing + "Fuse attendees" count + optional promo code slot. Ask organizers to mention Fuse once to their community — that's the acquisition loop.
- **Stage 2 (later):** organizer self-serve portal (separate login, submit event → admin approves). Out of scope for this iteration; fields designed now so nothing needs migration.

---

## Part 3 — Perception & GTM: how the first 1000 connect with the niche

### 3.1 The perception shift
Fuse stops being perceived as "another dating app with a shop tab" and becomes **"Chennai's going-out app where you never go alone."** Two doors into the same app:
- **Single & social** → "Meet People": join a run club, a games night, a house party — see who else is going, connect after. Zero swipe pressure. The *acquisition* door (especially for women — group settings are a lower-stakes entry than 1:1 matching).
- **Matched / dating** → "Date Ideas": venues, gifts, bookings, invite-your-match. The *retention/monetization* door.

An ad for a run club circle is fundamentally more believable at 100 users than a dating ad, because a dating app with 100 users has an empty deck — but a run club with 60 real runners + 8 Fuse people is a full, real experience from day one. **Explore social events make Fuse useful before matching liquidity exists.** That's the cold-start answer.

### 3.2 The ad-to-download chain
1. **Reels show real Chennai events, not app UI.** "This Saturday: sunrise run at Marina — 12 Fuse people already going" is local, time-bound, FOMO-driven and verifiable. Hinge can't post this (no events); District can't post this (no people/community, just inventory).
2. **Organizer cross-promo = borrowed trust.** Each green-lit organizer mentions "RSVP on Fuse" to an audience that already trusts them. First 1000 users arrive through communities they already belong to.
3. **Concrete perk in every ad**: promo code / circle access / Founding-100 early access — a reason to install *today* tied to a real plan this weekend.
4. **The niche identity**: dating culture + meetups, end to end — swipe to booking. Tagline direction: **"Match. Gift. Go out — with your match or with the city."**

### 3.3 Marketing plan integration (see FUSE_MARKETING_PLAN.md §14)
- 6th content pillar: **"This weekend on Fuse"** — weekly event-roundup reel/carousel (save-bait + FOMO + organizer tags = shares from organizers' own accounts).
- New reel angles: "POV: you moved to Chennai and know nobody" (meetups), "I went to a run club alone — here's who I met" (UGC), "House party but everyone's verified" (safety-quiet).
- Phase A boost: each listed event is a micro-campaign (announce → circle teaser countdown → post-event recap reel). 4 events/month = 12+ content moments/month for free.
- Phase B mixer becomes just "the first Fuse-hosted event in the Meet People feed" — infrastructure already built by then.

---

## Part 4 — Technical architecture

### 4.1 Data models

**`FUSE - BE/api/models/Event.js` — extend (backward compatible; existing docs default to today's behavior):**
- `audience: enum["DATE_IDEA","MEET_PEOPLE"]` (default MEET_PEOPLE, indexed)
- `pricingType: enum["FREE_RSVP","PAID_EXTERNAL","PAID_FUSE"]` (default PAID_FUSE)
- `organizer: { name, instagram, phone }` — phone **never serialized** to app
- `externalBookingUrl`, `externalPrice` (display string), `promoCode` (revealed only post-RSVP)
- `checkInCode` (4-digit, admin-only, never serialized), `checkInOpensAt/ClosesAt` (default eventDate−2h → end+2h)
- `rsvpCap` (null = unlimited), `rsvpCount` (denormalized counter, like `soldSlots`)
- `ticketPrice`/`totalSlots` become conditionally required (PAID_FUSE only) — validate in `upsertEvent` controller code, **not** schema `required` functions (update-validator `this` pitfall, Risk #3)
- New index `{ isActive, audience, eventDate, city }`. No migration needed.

**New `FUSE - BE/api/models/EventRsvp.js`** — single source of truth for circle membership:
- `userId, eventId, status: enum[GOING, CANCELLED, CHECKED_IN], source: enum[RSVP, TICKET], ticketOrderId?, showMeInCircle (default true), eventSnapshot{title,eventDate,eventEndDate}, checkedInAt/cancelledAt/promoRevealedAt`
- Unique `{userId, eventId}`; indexes for circle queries, rate limits, 48h-boost lookups.
- `EventController.confirmTicketPayment` upserts a `source:"TICKET"` RSVP when a PAID_FUSE order confirms — paid buyers enter the circle through the same door.

**New `FUSE - BE/api/models/EventWave.js`** — waves are NOT stored in `Like`:
- `Like` has a global unique `{likerId, likedUserId}` index + 3-state machine (`pending/matched/closed`); an event-scoped wave after a past left-swipe (closed Like) would collide/resurrect state. Waves also need per-event caps (`eventId` dimension).
- `eventId, fromUserId, toUserId, status: enum[PENDING, MATCHED, DECLINED, EXPIRED]`; unique `{eventId, fromUserId, toUserId}`.
- **Mutual wave → chat via extraction**: pull the match-establishment block out of `SwipeController.js` (lines ~251–291: `$addToSet` matches, `Like.updateMany → matched`, `resolveActiveChatForPair`, `ensureChatTwilioChannel`) into new `api/services/matchService.js` → `establishMatch({userAId, userBId, source, eventId})`. SwipeController refactors to call it (behavior-identical); the wave endpoint calls the same function. Waves dual-write `SwipeRecord` (action:"like") so decks stay clean. `Like` gains `source: enum["swipe","event_wave"]` + optional `eventId` for attribution only.

**`UserProfile.js` — extend:**
- `eventStats: { checkInCount, currentStreak, lastCheckInAt, badges[] }` ("FUSE_REGULAR" at 3 check-ins)
- `discoveryPreferences.eventScope: enum[EVERYONE, EVENT_GOERS, MY_CIRCLES]` (default EVERYONE)

### 4.2 Backend endpoints — new `EventCircleController.js`, routes on `ExploreRoutes.js`

| Route | Behavior |
|---|---|
| `POST /events/:id/rsvp` | FREE_RSVP/PAID_EXTERNAL only; rsvpCap + rate limits (5 active / 3 per day, reason codes, mirroring `checkGiftRateLimits` in giftEligibilityService.js); returns promoCode for PAID_EXTERNAL; notification + `logEvent` |
| `POST /events/:id/rsvp/cancel` | → CANCELLED, decrements counter, kills circle access immediately |
| `PATCH /events/:id/rsvp` | Toggle `showMeInCircle` |
| `GET /events/:id/circle` | Active RSVP → attendee grid (name, age, first photo, shared-interest chips, wave states), filters `showMeInCircle:false` + blocked pairs (reuse `getBlockedProfileIds` / `hasBlockBetweenUsers`); no RSVP → teaser `{goingCount, genderBalance, sharedInterestCount}` only |
| `POST /events/:id/checkin` | 4-digit code + time window → CHECKED_IN, eventStats/streak/badge updates |
| `POST /events/:id/wave` | Both active RSVPs, no block, cap 3/event; reciprocal → `matchService.establishMatch` → real chat; notifications with deep links |
| `GET /my-events` | Upcoming/past RSVPs for MyEventsScreen |

Circle dissolution is **query-time** (no cron): endpoints return empty/410 after eventEnd+48h; streak decay computed lazily at check-in.

**`ExploreController.getExploreHome`**: one endpoint with `?mode=dates|people` (shares serializers/auth/analytics; legacy no-param shape preserved). Adds `defaultMode` (has matches → dates, else people). People mode rails: My events, This weekend, Free to join, Featured social — all `audience:"MEET_PEOPLE"`, events serialized with `goingCount`. Serializers add audience/pricingType/organizer-safe-subset/external fields; never checkInCode/organizer.phone/promoCode (promo only in detail for RSVP'd viewer). `getEvents` gains `audience`/`pricingType` filters.

**Admin** (`AdminExploreController/Routes` + `public/admin/explore.html`): new fields in event form (audience + pricingType selects, organizer, external URL, promo, rsvpCap; checkInCode read-only + regenerate; category becomes enum select); new `GET /api/admin/explore/events/:id/rsvps` roster panel. `upsertEvent` already `$set`s the body, so schema fields flow through.

**Notifications** (`notificationTypes.js` + `fuse/app/notifications/*`): `EVENT_RSVP_CONFIRMED`, `EVENT_WAVE_RECEIVED` (→ EventCircle), `EVENT_WAVE_MATCHED` (→ ChatScreen), `EVENT_BADGE_EARNED` (→ MyEvents), optional `EVENT_CHECKIN_OPEN` (needs scheduler — defer if no cron infra).

### 4.3 Discovery integration (`ProfileController.js` + FilterScreen)
- `normalizeDiscoveryFilters` (~line 597): accept `eventScope`. Deck-cache invalidation is free (filtersKey = JSON of filters).
- `buildDiscoveryDeck`: `EVENT_GOERS` → `eventStats.checkInCount ≥ 1` hard filter; `MY_CIRCLES` → `$in` co-attendee ids from shared circles (respecting showMeInCircle); empty circle → empty deck with helper copy.
- `scoreAndRankCandidates` (~line 708): `sharedEventScore = 250` for candidates checked into the same event within the last 48h (between interests' 200 cap and activity's 300); emit `sharedEventTitle` → swipe card chip "You were both at X".
- `FilterScreen.tsx`: three-option pill row (Everyone / Event-goers / My circles) added to `DiscoveryFilters` + defaults; persistence already flows via `filters:${uid}` + `discoveryPreferences` update.

### 4.4 Frontend
- **ExploreHomeScreen**: `mode` state + new `ExploreModeToggle` component under the top bar; body splits into `DateIdeasSection` (today's content: venues/gifts/premium) and `MeetPeopleSection` (event rails); per-mode lazy fetch + cache; initial mode from AsyncStorage `exploreMode:${uid}` else server `defaultMode`. `CategoryStrip` becomes prop-driven (People mode: Run clubs / Meetups / Parties / Gigs mapping to Event.category enum).
- **EventDetailScreen**: StickyCTABar branches on pricingType (RSVP / external link + "join the circle" / Razorpay unchanged); "Who's going" teaser→grid section; showMeInCircle toggle; check-in code input during window; promo card post-RSVP.
- **New screens**: `EventCircleScreen.tsx` (full grid + waves), `MyEventsScreen.tsx` (upcoming/past + promo codes + check-in status) — registered in `AppNav.js`.
- **exploreApi.ts**: extended Event type + `rsvpEvent, cancelRsvp, updateRsvpVisibility, getEventCircle, checkInEvent, waveAtAttendee, getMyEvents, getHome(mode)`.
- **EventCard**: `goingCount` + pricing pill (Free / ₹external / price).

---

## Part 5 — Implementation stages & verification

Gift flow and existing Razorpay ticket flow stay untouched throughout (regression-safe at every stage).

| Stage | Scope | Done when |
|---|---|---|
| **A** | Schemas (Event ext., EventRsvp, UserProfile ext.) + admin CRUD/form | Admin creates FREE_RSVP & PAID_EXTERNAL events via explore.html; existing PAID_FUSE events serve unchanged |
| **B** | Home mode split (backend `?mode=` + segmented ExploreHome, prop-driven CategoryStrip, EventCard pills) | Toggle works, defaults by match presence; Dates mode visually identical to today; legacy /home shape intact |
| **C** | RSVP lifecycle + EventDetail CTA branching + promo reveal + MyEvents + ticket-confirm→RSVP upsert | RSVP/cancel/external/promo all work; rate limits enforced; Razorpay flow byte-identical apart from silent RSVP upsert |
| **D** | Event Circle: teaser, grid, waves; `matchService` extraction from SwipeController; EventWave model; EventCircleScreen | Mutual wave produces a real chat visible in ChatList that supports gifts; blocked pairs invisible; cancel revokes access; **manual swipe→match regression pass** |
| **E** | Check-in + eventStats/streak/Fuse Regular badge + admin RSVP roster | Code within window flips CHECKED_IN, stats update, badge at 3; admin sees roster + code |
| **F** | Discovery: eventScope filter + 250-pt shared-event boost + FilterScreen pills + card chip | Filters hard-filter deck; "You were both at X" appears for 48h post-checkin then decays (≤15min cache fuzz OK) |
| **G** | Notifications deep-links finalized, analytics funnel audit (mode_switch → rsvp → checkin → wave → match), empty states, copy | Every deep link lands cold-start; full funnel logged |

### Verification approach
- Backend: run server locally, exercise endpoints via admin page + REST (seed a FREE_RSVP run-club event via updated seedEvents.js); verify block-pair filtering with two test accounts + a Block record.
- App: Expo dev build with two test accounts — RSVP on both, verify teaser vs grid, wave both ways → chat appears in ChatList; enter check-in code inside/outside window; flip eventScope filters and confirm deck changes (use `forceRebuild`).
- Regression: full manual pass of swipe→like→match→chat and gift purchase after the Stage D matchService extraction (riskiest touch, per Risk #1).

### Key risks
1. **SwipeController extraction is the hot-path risk** — must be mechanically pure; regression pass mandatory.
2. **Wave overrides a past left-swipe** (product decision embedded): mutual wave upserts Likes per-direction, deliberately overriding `closed`.
3. Event `required` validators must live in controller code for update-validator correctness.
4. `rsvpCount` may drift under races — teaser uses counter, grid counts real rows.
5. Teaser gender-balance includes `showMeInCircle:false` users in aggregate only (identity-safe); grid respects the toggle.
6. PAID_EXTERNAL RSVP ≠ bought ticket — pre-event circles can include no-shows; check-in gates the perks (accepted risk).
7. No cron infra → reminders (`EVENT_CHECKIN_OPEN`) deferred; all dissolution/streak logic is lazy/query-time.

---

---

## Part 6 — Detailed Phase-by-Phase Engineering Plan

Exact steps per stage, with real file paths and current code anchors (verified against the codebase, not the summarized version). Each stage assumes the previous stage is merged. Nothing here changes the gift flow or the existing Razorpay ticket flow.

### Stage A — Schemas + admin CRUD (backend only, zero app impact)

1. **`FUSE - BE/api/models/Event.js`** — add fields to the schema (after `agePolicy/dressCode/importantInfo`, before the closing brace at line 42):
   ```js
   audience: { type: String, enum: ["DATE_IDEA", "MEET_PEOPLE"], default: "MEET_PEOPLE", index: true },
   pricingType: { type: String, enum: ["FREE_RSVP", "PAID_EXTERNAL", "PAID_FUSE"], default: "PAID_FUSE" },
   organizer: { name: String, instagram: String, phone: String },
   externalBookingUrl: { type: String },
   externalPrice: { type: String },
   promoCode: { type: String },
   checkInCode: { type: String },
   checkInOpensAt: { type: Date },
   checkInClosesAt: { type: Date },
   rsvpCap: { type: Number, default: null },
   rsvpCount: { type: Number, default: 0 },
   ```
   Remove `required: true` from `ticketPrice` (line 29) and `totalSlots` (line 31) — leave `min: 0` / no min. Do **not** replace with a `required: function(){...}` — Mongoose runs `runValidators` update-validators with a different `this` context and `AdminExploreController.upsertEvent` (line 280) uses `findByIdAndUpdate(..., { runValidators: true })`, so a schema-level conditional-required function would misfire on edits (Risk #3). Validate conditionally in the controller instead (step 5).
   Add index after the existing two (line 46-47): `eventSchema.index({ isActive: 1, audience: 1, eventDate: 1, city: 1 });`
   No migration needed — every existing document is missing these fields, so Mongoose defaults (`MEET_PEOPLE`/`PAID_FUSE`) apply on read, reproducing today's behavior exactly.

2. **New `FUSE - BE/api/models/EventRsvp.js`**:
   ```js
   userId: ObjectId ref UserProfile, required, index
   eventId: ObjectId ref Event, required, index
   status: enum [GOING, CANCELLED, CHECKED_IN], default GOING
   source: enum [RSVP, TICKET], default RSVP
   ticketOrderId: ObjectId ref EventTicketOrder
   showMeInCircle: Boolean, default true
   eventSnapshot: { title: String, eventDate: Date, eventEndDate: Date }
   checkedInAt, cancelledAt, promoRevealedAt: Date
   timestamps: true
   ```
   Indexes: `{ userId: 1, eventId: 1 }` unique; `{ eventId: 1, status: 1 }`; `{ userId: 1, status: 1, "eventSnapshot.eventDate": 1 }`.

3. **`FUSE - BE/api/models/UserProfile.js`** — insert after the `discoveryPreferences.activeOnly` line (currently line 145, just before the closing `},` of `discoveryPreferences` at line 146):
   ```js
   eventScope: { type: String, enum: ["EVERYONE", "EVENT_GOERS", "MY_CIRCLES"], default: "EVERYONE" },
   ```
   And a new top-level block near `safetyPreferences` (line 119-122):
   ```js
   eventStats: {
     checkInCount: { type: Number, default: 0 },
     currentStreak: { type: Number, default: 0 },
     lastCheckInAt: { type: Date, default: null },
     badges: { type: [String], default: [] },
   },
   ```

4. **`FUSE - BE/api/controllers/AdminExploreController.js`** — `upsertEvent` (line 274-288) currently does a bare `$set: data` with no validation. Add before the create/update branch:
   - If `data.pricingType === "PAID_FUSE"` (or unset, since that's the default): require `data.ticketPrice != null && data.totalSlots != null`, else `400`.
   - On create (`!eventId`), if `!data.checkInCode`, generate one: `String(Math.floor(1000 + Math.random() * 9000))`.
   - Leave the rest of the `$set data` pass-through as-is — new schema fields flow through automatically once the schema (step 1) has them.

5. **`FUSE - BE/public/admin/explore.html`** event form — add inputs: `audience` `<select>` (Date Idea / Meet People), `pricingType` `<select>` (Free RSVP / Paid External / Paid via Fuse), `organizer.name`/`organizer.instagram`/`organizer.phone` text inputs, `externalBookingUrl`, `externalPrice`, `promoCode`, `rsvpCap` number input, `checkInCode` shown read-only with a "Regenerate" button (client-side random 4-digit, PATCHed on save). Replace the current free-text `category` input (`ef-category`) with a `<select>` bound to the Event schema enum (`comedy, music, party, social, sports, workshop, food, other`) so admin data stays valid. Add simple client-side JS to show/hide `ticketPrice`/`totalSlots` vs `externalBookingUrl`/`externalPrice` based on the `pricingType` selection.

6. **`FUSE - BE/api/scripts/seedEvents.js`** — add 2-3 example `MEET_PEOPLE`/`FREE_RSVP` and `PAID_EXTERNAL` events (e.g. "Sunrise Run Club — Marina Beach", "Board Game Night — Ciclo Café") alongside the existing seeded ones, so Stage B onward has real data to render against.

**Verify:** run the backend locally, log into `explore.html`, create one `FREE_RSVP` event and one `PAID_EXTERNAL` event, confirm both save and `GET /api/explore/events` returns them; confirm pre-existing `PAID_FUSE` events still load and their detail/ticket-purchase flow is untouched.

---

### Stage B — Home mode split + segmented Explore UI

1. **`FUSE - BE/api/controllers/ExploreController.js`**:
   - `getExploreHome` (lines 12-54): read `const mode = req.query.mode === "people" || req.query.mode === "dates" ? req.query.mode : null;`. Compute `defaultMode`: `const me = await UserProfile.findById(userId).select("matches").lean(); const defaultMode = (me?.matches?.length > 0) ? "dates" : "people";`. If `mode` is `null`, keep the exact current query/response shape (back-compat for any cached app build) and just append `defaultMode` to the JSON. If `mode === "people"`, replace the four parallel queries with `Event.find({ isActive:true, city, audience:"MEET_PEOPLE", eventDate:{$gte:new Date()} })` variants for `myUpcomingEvents` (needs `EventRsvp` — will return empty until Stage C ships, that's expected and fine), `thisWeekend`, `freeEvents` (`pricingType:"FREE_RSVP"`), `featuredSocial`. If `mode === "dates"`, keep today's venues/events(`audience:"DATE_IDEA"`)/gifts query set.
   - `getEvents` (104-126): add optional `audience`/`pricingType` to the `filter` object from `req.query`.
   - `serializeEvent` (177-193): add `audience: e.audience, pricingType: e.pricingType, organizer: e.organizer ? { name: e.organizer.name, instagram: e.organizer.instagram } : undefined, externalBookingUrl: e.pricingType === "PAID_EXTERNAL" ? e.externalBookingUrl : undefined, externalPrice: e.externalPrice, rsvpCap: e.rsvpCap, goingCount: e.rsvpCount || 0`. Never include `checkInCode`, `organizer.phone`, or `promoCode` here (promo is detail-only and viewer-gated, added in Stage C).

2. **`fuse/app/api/exploreApi.ts`**:
   - `Event` type (lines 31-52): add `audience: string; pricingType: string; organizer?: { name: string; instagram?: string }; externalBookingUrl?: string; externalPrice?: string; rsvpCap?: number | null; goingCount?: number;`
   - `ExploreHome` type (64-69): add `mode?: string; defaultMode?: "dates" | "people"; myUpcomingEvents?: Event[]; thisWeekend?: Event[]; freeEvents?: Event[]; featuredSocial?: Event[];`
   - `getHome` (line 209): accept `mode?: "dates" | "people"` and append `?mode=${mode}` to the request URL when provided.

3. **`fuse/components/ui/explore/CategoryStrip.tsx`** — make it prop-driven: change `Props` to accept an optional `categories` array (default to the existing `CATEGORIES` const at lines 14-25 when omitted, so `ExploreCategoryScreen` and anywhere else using the default keeps working unmodified). Export a second const `SOCIAL_CATEGORIES` mapping to `Event.category` enum values for People mode (e.g. `sports→"Run clubs"`, `social→"Meetups"`, `party→"Parties"`, `music→"Gigs"`).

4. **`fuse/components/ui/explore/EventCard.tsx`** — add a `goingCount` badge and a pricing pill computed from `pricingType` (`Free` / `Via organizer` / `₹{ticketPrice}`).

5. **`fuse/app/screens/ExploreHomeScreen.tsx`**:
   - Add `mode` state; on mount read AsyncStorage `exploreMode:${uid}`; call `exploreApi.getHome(mode)`. On the first response where no stored preference exists, adopt `res.defaultMode` and persist it.
   - New `fuse/components/ui/explore/ExploreModeToggle.tsx` segmented control, rendered under the existing `topBar` block (after line 104, before the `ScrollView` at line 106).
   - Split the current body (venue rail 136-161, gift rail 192-217, premium banner 220-236) into a `DateIdeasSection`; add a new `MeetPeopleSection` (My events / This weekend / Free to join rails, each `SectionRail` + `EventCard`, reusing the existing `ComingSoonCard` pattern (lines 262-298) for the empty state when no organizer listings exist yet).
   - `HERO_SLIDES` (lines 26-45): keep as the Dates-mode hero; add a small People-mode hero slide set.

6. **`fuse/app/screens/ExploreCategoryScreen.tsx`** — thread an `audience` param through to `exploreApi.getEvents({ audience, category })` when navigated from People mode.

**Verify:** toggle switches instantly between modes; `GET /api/explore/home` called with no `mode` query param returns the exact legacy shape (regression check against a saved response); Dates mode renders pixel-identical to today; People mode shows seeded Stage-A events with `goingCount: 0` (expected, RSVP writes don't exist yet).

---

### Stage C — RSVP lifecycle + EventDetail branching + promo reveal

1. **New `FUSE - BE/api/controllers/EventCircleController.js`** (file created here, extended in D/E):
   - `createRsvp` — `POST /events/:eventId/rsvp`. Load event (`isActive`, `eventDate >= now`, `pricingType` in `[FREE_RSVP, PAID_EXTERNAL]`). Rate limits mirroring `checkGiftRateLimits` (`giftEligibilityService.js:88-143`): active count `EventRsvp.countDocuments({ userId, status:"GOING", "eventSnapshot.eventDate": { $gte: new Date() } })` must be `< 5`; daily count `EventRsvp.countDocuments({ userId, createdAt: { $gte: startOfToday() } })` must be `< 3` — reuse the `startOfToday()` helper pattern from that same file. `rsvpCap` check against `event.rsvpCount`. Upsert `EventRsvp` (`status:"GOING", source:"RSVP", showMeInCircle: req.body.showMeInCircle ?? true`), `$inc` `event.rsvpCount` only on a genuinely new/reactivated GOING row. `logEvent("event_rsvp_created", ...)`, notify `EVENT_RSVP_CONFIRMED`. Response: `{ success, rsvp: { status, showMeInCircle }, promoCode: pricingType === "PAID_EXTERNAL" ? event.promoCode : undefined }`.
   - `cancelRsvp` — `POST /events/:eventId/rsvp/cancel` → status `CANCELLED`, `cancelledAt`, `$inc rsvpCount: -1` (floor 0).
   - `updateRsvpVisibility` — `PATCH /events/:eventId/rsvp` → toggles `showMeInCircle`.
   - `getMyEvents` — `GET /my-events` → `EventRsvp.find({ userId, status: { $in: ["GOING","CHECKED_IN"] } })`, split upcoming/past by `eventSnapshot.eventDate` vs now.

2. **`FUSE - BE/api/routes/ExploreRoutes.js`** — add a new "Event circle" section after the existing `/events/:eventId` route (line 43): `router.post("/events/:eventId/rsvp", createRsvp); router.post("/events/:eventId/rsvp/cancel", cancelRsvp); router.patch("/events/:eventId/rsvp", updateRsvpVisibility); router.get("/my-events", getMyEvents);`

3. **`FUSE - BE/api/controllers/EventController.js`** — in `confirmTicketPayment`, immediately after the slot-reservation line (`await Event.findByIdAndUpdate(order.eventId, { $inc: { soldSlots: order.quantity } });`, line 147), add a silent upsert: `EventRsvp.findOneAndUpdate({ userId, eventId: order.eventId }, { $set: { status: "GOING", source: "TICKET", ticketOrderId: order._id, eventSnapshot: { title: order.eventSnapshot.title, eventDate: order.eventSnapshot.eventDate } } }, { upsert: true }).catch(() => {});` — fire-and-forget, does not touch the existing response shape (line 167).

4. **`ExploreController.getEventDetail`** (lines 128-146) — after loading `event`, fetch `const myRsvp = await EventRsvp.findOne({ userId, eventId }).lean();` and add to the response: `myRsvp: myRsvp ? { status: myRsvp.status, showMeInCircle: myRsvp.showMeInCircle } : null, promoCode: (myRsvp && event.pricingType === "PAID_EXTERNAL") ? event.promoCode : undefined`.

5. **`FUSE - BE/api/services/notifications/notificationTypes.js`** — add `EVENT_RSVP_CONFIRMED: "EVENT_RSVP_CONFIRMED"` to `NOTIFICATION_TYPES` (near the other Explore entries, line ~30) and a matching `NOTIFICATION_DEFAULTS` entry (`screen: "MyEvents"`), following the exact shape of the existing `BOOKING_CONFIRMED` entry (lines 138-142).

6. **`fuse/app/notifications/notificationNavigation.ts`** — add `case NOTIFICATION_TYPES.EVENT_RSVP_CONFIRMED: return { name: "MyEvents" };` next to the existing Explore-bookings case block (lines 100-106).

7. **`fuse/app/screens/EventDetailScreen.tsx`** — `StickyCTABar` branches on `event.pricingType`: `PAID_FUSE` unchanged (existing Razorpay flow); `FREE_RSVP` → "RSVP — I'm going" calling the new `exploreApi.rsvpEvent`, flipping to "Going ✓ · Cancel"; `PAID_EXTERNAL` → primary "Book via organizer" (`Linking.openURL(event.externalBookingUrl)`) + secondary "I'm going — join the circle" RSVP button; promo-code card shown once `myRsvp` exists and `promoCode` is present.

8. **New `fuse/app/screens/MyEventsScreen.tsx`** — upcoming/past sections, cancel action, promo code display, status pill. Register in `fuse/AppNav.js` next to the existing `EventDetail` registration (line 238): `<Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ headerShown: false }} />`.

9. **`fuse/app/api/exploreApi.ts`** — add `rsvpEvent`, `cancelRsvp`, `updateRsvpVisibility`, `getMyEvents` methods and an `EventRsvp` type.

**Verify:** RSVP + cancel + promo reveal work for both `FREE_RSVP` and `PAID_EXTERNAL` events; the 6th active RSVP and the 4th same-day RSVP are correctly rejected with reason codes; buying a `PAID_FUSE` ticket silently creates a `GOING` `EventRsvp` row without changing the purchase response JSON (diff it before/after this stage).

---

### Stage D — Event Circle (teaser, grid, waves) + matchService extraction

This is the highest-risk stage — it touches the live swipe/match hot path.

1. **New `FUSE - BE/api/services/matchService.js`** — move (not duplicate) three pieces out of `SwipeController.js`:
   - `normalizePairKey` (currently lines 10-11)
   - `resolveActiveChatForPair` (currently lines 23-57)
   - `buildMatchResponse` (currently lines 59-102), which itself calls `resolveActiveChatForPair` and `ensureChatTwilioChannel`
   Add a new exported `establishMatch({ userAId, userBId, source = "swipe", eventId = null })` that performs exactly the DB-write block currently at `SwipeController.js:251-281` (`UserProfile.updateOne` ×2 with `$addToSet matches/swipedRight`, `Like.updateMany → { status: "matched" }`), then calls `buildMatchResponse` to produce the chat/response payload. `SwipeController.js` is refactored to `import { normalizePairKey, buildMatchResponse, establishMatch } from "../services/matchService.js"` and call these instead of its local copies — **the goal is byte-identical behavior**, this is a pure extraction, not a rewrite.
   - `Like.js` — add two additive fields (no index change): `source: { type: String, enum: ["swipe", "event_wave"], default: "swipe" }`, `eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null }`.

2. **New `FUSE - BE/api/models/EventWave.js`**: `eventId, fromUserId, toUserId: ObjectId refs, required`; `status: enum [PENDING, MATCHED, DECLINED, EXPIRED], default PENDING`. Unique index `{ eventId: 1, fromUserId: 1, toUserId: 1 }`; index `{ eventId: 1, toUserId: 1, status: 1 }`; index `{ eventId: 1, fromUserId: 1 }` (for the per-event cap count).

3. **`EventCircleController.js`** — add:
   - `getCircle` — `GET /events/:eventId/circle`. If my `EventRsvp.status` is `GOING`/`CHECKED_IN`: build the attendee grid from `EventRsvp.find({ eventId, status: { $in: ["GOING","CHECKED_IN"] }, showMeInCircle: true, userId: { $ne: myUserId } })`, populate against `UserProfile` (name, age from `dateOfBirth`, `photos[0]`, `interests`), filter out blocked pairs (`hasBlockBetweenUsers` from `giftEligibilityService.js:49`, batched via one `Block.find` across candidate ids rather than N queries), compute `sharedInterestCount` vs my `interests`, attach my outgoing `EventWave` status per candidate. If not active: return the teaser only — `{ goingCount, genderBalance: {men, women}, sharedInterestCount }` via an `EventRsvp`→`UserProfile` aggregation, no identities.
   - `wave` — `POST /events/:eventId/wave`, body `{ toUserId }`. Validate: both parties have active RSVPs on this event, `hasBlockBetweenUsers`/`hasSafetyHoldBetweenUsers` both false (reuse `giftEligibilityService.js:49,60`), target's `showMeInCircle` is true, and `EventWave.countDocuments({ eventId, fromUserId: myId }) < 3`. Upsert a `PENDING` `EventWave`. Check for a reciprocal `PENDING` wave the other direction; if found: flip both to `MATCHED`, call `matchService.establishMatch({ userAId: myId, userBId: toUserId, source: "event_wave", eventId })`, dual-write `SwipeRecord` `{ action: "like" }` in both directions (keeps discovery decks clean per Risk #2 below — a mutual wave deliberately overrides any prior `closed` `Like` from an earlier left-swipe), notify both users `EVENT_WAVE_MATCHED` with the resulting `chatId`. If no reciprocal wave: notify the target `EVENT_WAVE_RECEIVED`.

4. **`ExploreRoutes.js`** — add `router.get("/events/:eventId/circle", getCircle); router.post("/events/:eventId/wave", wave);`

5. **`notificationTypes.js`** / **`notificationNavigation.ts`** — add `EVENT_WAVE_RECEIVED` (screen `"EventCircle"`) and `EVENT_WAVE_MATCHED` (screen `"ChatScreen"`, carrying `chatId` in `data` — mirror the exact param shape the existing `CHAT_MESSAGE` case builds at `notificationNavigation.ts:19-37`, do not invent a new shape).

6. **New `fuse/app/screens/EventCircleScreen.tsx`** — attendee grid, wave button + per-event cap indicator, wave-back on incoming. Register in `AppNav.js` next to `EventDetail`. **`EventDetailScreen.tsx`** — add the "Who's going" section: teaser card pre-RSVP, embedded preview grid (first ~6 attendees) + "See all" → `EventCircleScreen` post-RSVP, `showMeInCircle` toggle.

7. **`exploreApi.ts`** — add `getEventCircle`, `waveAtAttendee` and a `CircleAttendee` type.

**Verify (mandatory before merging):**
- Two test accounts RSVP the same event; each sees the other in the grid.
- Wave both directions → both accounts get a real chat that appears in `ChatList`; send a gift in that chat to prove full `Like`/`matches` compatibility, not just chat existence.
- Create a `Block` record between two RSVP'd users → neither appears in the other's grid.
- Cancel RSVP → `getCircle` immediately returns the no-access/teaser state.
- **Regression pass**: two unrelated accounts do a normal swipe-right/swipe-right — confirm the match still happens and the chat still opens exactly as before the extraction. Also confirm re-swiping an already-matched pair still returns `noop_matched` correctly. This is the one step in the whole plan that must not be skipped.

---

### Stage E — Check-in + perks + admin roster

1. **`EventCircleController.js`** — add `checkin` — `POST /events/:eventId/checkin`, body `{ code }`. Require an active RSVP; `event.checkInCode === code`; current time within the check-in window (`checkInOpensAt`/`checkInClosesAt` if set on the event, else computed as `eventDate - 2h` → `(eventEndDate || eventDate + 4h) + 2h`). Flip `EventRsvp.status → CHECKED_IN`, set `checkedInAt`. Update `UserProfile.eventStats`: increment `checkInCount`; streak logic — if `lastCheckInAt` is within a reasonable recency window of a prior check-in, increment `currentStreak`, else reset to 1; push `"FUSE_REGULAR"` into `badges` the first time `checkInCount` reaches 3, and notify `EVENT_BADGE_EARNED` only on that transition (not every check-in).
2. **`ExploreRoutes.js`** — `router.post("/events/:eventId/checkin", checkin);`
3. **`notificationTypes.js`** — add `EVENT_BADGE_EARNED` (screen `"MyEvents"`).
4. **Admin**: new `GET /api/admin/explore/events/:eventId/rsvps` in `AdminExploreController.js`/`AdminExploreRoutes.js` returning the RSVP/check-in roster (so an admin/organizer at the venue can cross-check the code and see who's actually shown up); a simple roster panel in `explore.html` next to the existing Events tab.
5. **Frontend**: check-in code entry UI in `EventDetailScreen.tsx` (shown only inside the check-in window for RSVP'd users); a small badge indicator wherever profile badges would surface (e.g. profile header) for `FUSE_REGULAR`.

**Verify:** entering the correct code inside the window flips status to `CHECKED_IN` and increments stats; entering it outside the window is rejected; the badge is awarded exactly once at the 3rd check-in; admin can see the roster and read the code to give to an organizer.

---

### Stage F — Discovery integration

1. **`FUSE - BE/api/controllers/ProfileController.js`**:
   - `normalizeDiscoveryFilters` (lines 597-627) — add to the returned object: `eventScope: ["EVENT_GOERS","MY_CIRCLES"].includes(safeFilters.eventScope) ? safeFilters.eventScope : "EVERYONE"`. No cache-invalidation work needed — `filtersKey = JSON.stringify(filters)` (line 852) already changes whenever this field changes.
   - `buildDiscoveryDeck` (lines 789-831) — after `baseMatch` is built (802-813) and before the `UserProfile.find` call (824), branch on `filters.eventScope`: `EVENT_GOERS` → `baseMatch["eventStats.checkInCount"] = { $gte: 1 };`. `MY_CIRCLES` → resolve my circle's user ids via `EventRsvp` (my `GOING`/`CHECKED_IN` event ids → co-attendees on those events with `showMeInCircle: true`), intersect into `baseMatch._id.$in` (careful: `baseMatch._id` already carries `$ne`/`$nin` from the exclusion logic at 802-806 — add `$in` alongside them, and if the circle-derived id list is empty, short-circuit and return `[]` immediately so the client can render "RSVP to events to use this filter" instead of silently falling back to `EVERYONE`).
   - Build a `sharedEventMap` **after** the candidate query (824-828) returns, scoped only to the fetched candidate ids: my `CHECKED_IN` `EventRsvp` rows where the event ended within the last 48h, joined against those same candidates' `CHECKED_IN` rows on the same events → `{ candidateIdString: eventTitle }`. Pass it into `scoreAndRankCandidates`.
   - `scoreAndRankCandidates` (lines 708-787) — accept the new `sharedEventMap` param; inside the `candidates.map` callback (723-777) add `const sharedEventScore = sharedEventMap[c._id.toString()] ? 250 : 0;`, fold it into the score sum at line 773, and add `_sharedEventTitle: sharedEventMap[c._id.toString()] || null` to the returned candidate object. 250 sits deliberately between the interest cap (200) and the max activity score (300) — strong but not dominant.
   - Wherever the scored candidates are serialized into the API response for `getFilteredProfiles` (after line 864), add `sharedEventTitle: c._sharedEventTitle` to the per-card payload.

2. **`UserProfile.js`** — already added `discoveryPreferences.eventScope` in Stage A (step 3); no further schema change needed here.

3. **`fuse/app/screens/FilterScreen.tsx`** — `DiscoveryFilters` type (lines 25-37): add `eventScope: "EVERYONE" | "EVENT_GOERS" | "MY_CIRCLES";`. `DEFAULT_FILTERS` (42-54): add `eventScope: "EVERYONE"`. The prefs-merge block (~232-243) and the save/clear calls (~309, ~331) already spread the whole filters object through to `discoveryPreferences`, so persistence is automatic once the field exists in the type/default — just add one explicit line to the `merged` object literal alongside the other fields (following the exact pattern already used there for `activeOnly`). Add a 3-pill row UI near the existing `activeOnly` toggle (~line 483) with short helper copy per mode.

4. **`fuse/app/screens/SwipeView.tsx`** (or its card component) — render `profile.sharedEventTitle` as a chip when present: "You were both at {title}".

**Verify:** `MY_CIRCLES` with zero shared events returns an empty deck with the helper-copy state (not a silent fallback); two test accounts checked into the same event within 48h show the "You were both at X" chip and a measurably higher `_discoveryScore` for each other than for an otherwise-identical stranger; the chip disappears roughly 48h after check-in (subject to the existing 15-minute deck cache TTL, which is an acceptable fuzz window per Risk #7 in Part 5).

---

### Stage G — Notifications, analytics, polish

1. Final sweep: confirm every new notification type (`EVENT_RSVP_CONFIRMED`, `EVENT_WAVE_RECEIVED`, `EVENT_WAVE_MATCHED`, `EVENT_BADGE_EARNED`) has a `NOTIFICATION_TYPES` entry, a `NOTIFICATION_DEFAULTS` entry, and a `notificationNavigation.ts` case, and that each deep-links correctly from a cold/killed-app start. `EVENT_CHECKIN_OPEN` (a pre-event reminder) stays deferred — no cron/scheduler infrastructure was found in this codebase for timed pushes (Risk #7).
2. `logEvent` funnel audit: `explore_mode_switched`, `event_rsvp_created`/`cancelled`, `event_circle_viewed`, `event_wave_sent`, `event_wave_matched`, `event_checked_in`, `event_promo_revealed`, `event_badge_earned` — confirm each fires exactly once per real action, not on retries/re-renders.
3. Optional: `opsAlertService.js` — add an `alertEventCapacity` alert when `rsvpCount` approaches `rsvpCap`, mirroring the existing `alertNewTicketOrder` pattern at `EventController.js:151`.
4. Empty states: People-mode home with zero `MEET_PEOPLE` listings (before the organizer pipeline produces any) needs a friendly card, following the existing `ComingSoonCard` pattern in `ExploreHomeScreen.tsx` (lines 262-298).
5. Copy pass on every new user-facing string (RSVP CTA, circle teaser, promo reveal, badge toast).

**Verify:** cold-start a fresh test account and manually walk the full funnel — mode switch → RSVP → check-in → wave → match → chat — confirming an `AnalyticsEvent` row is written at each step and every notification received mid-flow deep-links to the right screen from a killed-app state.

---

## Progress Log

| Stage | Status | Date | Notes |
|-------|--------|------|-------|
| Stage A | ✅ Complete | 2026-07-03 | Event.js extended (audience/pricingType/organizer/checkIn/rsvp fields), new EventRsvp.js model, UserProfile.js eventStats+eventScope, AdminExploreController validation + checkInCode generation/regeneration, explore.html form rebuilt (audience/pricingType/organizer/external/promo/rsvpCap fields, category enum select), seedEvents.js gained 2 MEET_PEOPLE examples (FREE_RSVP run club, PAID_EXTERNAL board game night) |
| Stage B | ✅ Complete | 2026-07-03 | ExploreController `?mode=dates\|people` split + `defaultMode` (by match presence), exploreApi.ts types/methods, CategoryStrip made prop-driven (+ SOCIAL_CATEGORIES), EventCard pricing pill + goingCount, ExploreHomeScreen segmented (ExploreModeToggle + DateIdeasSection/MeetPeopleSection), ExploreCategoryScreen threads audience/eventCategory/pricingType |
| Stage C | ✅ Complete | 2026-07-03 | New EventCircleController.js (createRsvp/cancelRsvp/updateRsvpVisibility/getMyEvents), routes wired, EventController ticket-confirm silently upserts EventRsvp, ExploreController.getEventDetail adds myRsvp/promoCode viewer context, EVENT_RSVP_CONFIRMED notification, EventDetailScreen CTA branches by pricingType, new MyEventsScreen.tsx, registered in AppNav.js |
| Stage D | ✅ Complete | 2026-07-03 | `matchService.js` extracted from SwipeController.js (normalizePairKey/resolveActiveChatForPair/buildMatchResponse relocated verbatim + new writeMatchState/establishMatch); new EventWave.js model; Like.js gained source/eventId attribution fields; EventCircleController getCircle (teaser vs grid, block-filtered) + wave (cap 3/event, mutual→match via matchService); new EventCircleScreen.tsx |
| Stage E | ✅ Complete | 2026-07-03 | checkin endpoint (code+window validation, eventStats/streak/FUSE_REGULAR badge logic), admin RSVP roster endpoint + explore.html panel, check-in UI + checked-in banner in EventDetailScreen, badge banner in MyEventsScreen |
| Stage F | ✅ Complete | 2026-07-03 | ProfileController: eventScope filter (EVENT_GOERS hard filter, MY_CIRCLES co-attendee intersection), sharedEventMap + 250-pt boost in scoreAndRankCandidates, sharedEventTitle in mapProfiles; FilterScreen 3-pill row; SwipeView "You were both at X" chip |
| Stage G | ✅ Complete | 2026-07-03 | Notification/deep-link sweep confirmed consistent; logEvent funnel completed (added event_promo_revealed); opsAlertService gained alertEventCapacity (80% threshold, fires once); empty states already covered by Stage B's ComingSoonCard pattern |

**Verification (2026-07-03):** All backend files syntax-checked (`node --check`), full frontend `tsc --noEmit` sweep shows 0 new errors (97 pre-existing baseline errors unchanged). Live smoke test against the real MongoDB (tagged throwaway data, fully cleaned up after) exercised the actual controller functions end-to-end: RSVP lifecycle + rate limits, circle teaser/grid + block filtering, mutual wave → match → chat, wave cap, check-in + streak + badge award, discovery eventScope filters + sharedEventTitle boost, **and a regression pass on ordinary swipe-matching** (like/pending/match/re-swipe-noop/dislike) to confirm the matchService extraction didn't break the existing swipe hot path. **35/35 assertions passed.**

Two real bugs were found and fixed during verification:
1. **`matchService.writeMatchState` used `Like.updateMany`, which only flips *existing* Like docs.** Event-wave matches have no prior Like document (waves aren't swipes), so no Like ever got created for wave-based matches. Fixed by switching to per-direction `findOneAndUpdate` with `upsert: true` — behavior-identical for the swipe path (docs already exist there) and now correct for the wave path.
2. **Admin `explore.html`'s event form sent `availableSlots`, but the schema field is `totalSlots`** — a pre-existing mismatch that meant admin-created events never actually got a slot count. Fixed while touching this exact form for the pricingType conditional fields (renamed to `ef-totalSlots`/`totalSlots` throughout).

Additionally hardened `serializeEvent`'s `isSoldOut`/`availableSlots` logic, which would have shown every `FREE_RSVP`/`PAID_EXTERNAL` event as permanently "sold out" once `ticketPrice`/`totalSlots` became optional (Stage A schema change) — now branches on `pricingType`.

---

## Launch-readiness addendum (2026-07-03)

A production-readiness audit (backend security/infra + mobile App Store checks) flagged the discovery deck cache as an Explore-adjacent scaling risk. Fixed:

- **New `FUSE - BE/api/services/discoveryDeckCache.js`** — the swipe/Explore discovery cache (`getCachedDeck`/`setCachedDeck`, 15-min TTL Map, extended by Stage F's `eventScope` filtering) was extracted out of `ProfileController.js` into its own module. Purely mechanical — same in-memory `Map`, same TTL/cleanup interval (now `.unref()`'d so it doesn't hold the process open), same two call sites in `getFilteredProfiles`. Verified with a live-DB smoke test (5/5 assertions: first-call build, cache-hit path, filter-change invalidation, `forceRebuild` bypass all behave identically post-extraction).
- **Why:** the cache is still per-process/in-memory — correct and safe on a **single backend instance**, but would silently serve inconsistent decks across users if the app is later run with more than one instance (PM2 cluster mode, autoscaling). Extracting it to one file means a future Redis swap only touches `discoveryDeckCache.js` — no changes needed anywhere discovery is called from.
- **Externally needed:** nothing for this fix. **Operationally: run the backend as a single Node process until Redis is wired** (no PM2 `cluster` mode / instance count > 1) — that's the actual constraint, not something code alone can remove without Redis.
- **Explicitly out of scope for this fix:** `api/middleware/rateLimit.js` (in-memory rate-limit buckets) — that file is shared by auth/chat/video/photo-upload, not Explore-specific, so it was left untouched per the user's request to scope this to Explore alone. It has the same single-instance constraint and should get the same treatment (or a Redis swap) in a later, broader pass.
- **Deferred to a separate pass (same audit, not yet started):** gift payments still stubbed (`giftPaymentProvider.js` throws for `RAZORPAY` mode — `GiftPaymentController.js` never migrated to the shared `paymentProvider.js` that Bookings/Tickets/Premium use), CORS wide open (`server.js` `origin: '*'`), no Razorpay webhook for async payment confirmation, `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`EXPO_ACCESS_TOKEN` missing from `.env`, missing iOS permission-usage strings in `fuse/app.json`.
