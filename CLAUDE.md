# Fuse Current Context + Swipe Discovery Implementation Analysis

This note is for Claude before starting the next implementation phase.

## 0. Read This First: Current Swipe Discovery Handoff Verified From Code

This section is the current source-of-truth for the filter screen, profile fetching, priority ordering, and swipe discovery wiring. It was verified against the current codebase. Some older sections below mention backend "widening variants"; that is stale. The current backend does not use variant widening. It builds one scored deck, caches it, paginates it, and only rebuilds with already-swiped users included if the unswiped deck is empty.

### Exact Files To Read For Implementation

Frontend:

* `fuse/app/screens/SwipeView.tsx`
  * Lines 25-30: API base, page size, prefetch threshold, discovery session storage keys.
  * Lines 32-38: `DiscoveryFilters` shape consumed from local storage.
  * Lines 79-86: persisted `DiscoverySession` shape.
  * Lines 145-168: `loadDiscoveryContext()` reads `jwtToken`, `userId`, and `filters:${userId}` from AsyncStorage.
  * Lines 193-237: restores cached local deck only when `filtersKey` matches.
  * Lines 239-319: `fetchProfilesPage()` POSTs to `/api/profile/filteredProfiles` with `{ filters, cursor, limit, forceRebuild }`, merges pages by `_id`, stores backend pagination.
  * Lines 321-345: reset fetch path.
  * Lines 348-393: focus behavior. First focus restores or fetches; later focus refetches only if serialized filters changed; shows "Filters applied" notice.
  * Lines 395-410: prefetch when remaining profiles are at or below 3.
  * Lines 412-425: when deck is exhausted, resets and fetches again.
  * Lines 427-445: persists deck/session back to AsyncStorage.
  * Lines 451-488: swipe/like calls to `/api/profile/swipe`.
  * Lines 549-638: left swipe records dislike; right swipe opens compliment modal and final send records like.
  * Line 681: filter button navigates to `FilterScreen`.

* `fuse/app/screens/FilterScreen.tsx`
  * Lines 25-31: saved filter shape: `ageRange`, `ageFlex`, `distanceKm`, `distanceFlex`, `interests`.
  * Lines 33-35: storage keys: `temporaryInterests`, `filtersAppliedNoticePending`.
  * Lines 41-45: default UI state is age 18-23, distance 17 km, both expand toggles false, interests empty.
  * Lines 53-103: on focus, loads `userId` and token, then temporary interests, then saved `filters:${uid}`; if no saved filters, GETs `/api/profile` only to seed `json.data.interests`.
  * Lines 105-120: Apply writes `filters:${userId}` locally, sets `filtersAppliedNoticePending`, removes temporary interests, and goes back.
  * Lines 122-127: Clear removes local filters and temporary interests.
  * Lines 151-188: age sliders and `ageFlex` switch.
  * Lines 191-215: distance slider and `distanceFlex` switch.
  * Lines 218-248: shared interests picker navigates to `Interests` with `fromFilter: true`.

* `fuse/app/screens/Interests.tsx`
  * Lines 15 and 120-138: filter-mode interests are stored only in AsyncStorage `temporaryInterests`; they do not update the real profile.
  * Lines 157-160: UI explicitly says filter interests are temporary for discovery only.

* `fuse/app/navigation/MainTabs.js`
  * Lines 14-22: `SwipeView` is a tab and `unmountOnBlur: false`, so returning from filters relies on focus logic and filter-key comparison.

* `fuse/AppNav.js`
  * Lines 177 and 189: both `Interests` and `FilterScreen` are registered stack screens.

Backend:

* `FUSE - BE/server.js`
  * Line 61: mounts profile routes under `/api/profile`.

* `FUSE - BE/api/routes/ProfileRoutes.js`
  * Lines 38-43: `GET /api/profile` fetches the logged-in profile; `GET/POST /api/profile/filteredProfiles` runs discovery.
  * Line 45: `POST /api/profile/swipe` records like/dislike via `SwipeController`.

* `FUSE - BE/api/controllers/ProfileController.js`
  * Lines 382-484: `getProfileByPhoneNumber()` fetches the authenticated user's profile for AuthGate/Profile/FilterScreen interest seeding.
  * Lines 516-522: discovery constants: page default 8, max page 20, max candidates 200, cache TTL 15 minutes.
  * Lines 524-561: fields selected for swipe cards.
  * Lines 563-588: in-memory deck cache keyed by user and serialized normalized filters.
  * Lines 597-617: normalizes incoming filters. Important: `filters.interests` is accepted here.
  * Lines 620-627: preferred gender resolution. Uses `preferredGender` if present; otherwise binary fallback `Man -> Woman`, `Woman -> Man`, no filter for others.
  * Lines 629-655: distance and age helpers.
  * Lines 665-691: excludes blocked users and already-swiped users, using `SwipeRecord` first and legacy `UserProfile.swipedUserIds` fallback.
  * Lines 694-753: priority ordering. Score = activity recency + shared interest score + distance score + age score. Activity is primary by weight. Shared interests are calculated from `requester.interests`, not selected filter interests.
  * Lines 704-705: `distanceFlex` and `ageFlex` only lower in-range score weights when true. They do not control hard filtering.
  * Lines 718-735: distance and age add points if in range; out-of-range profiles are not excluded.
  * Lines 755-792: base candidate query excludes self, blocked, swiped, and mostly incomplete onboarding; applies preferred gender if available; fetches up to 200 sorted by `lastActiveAt`, `updatedAt`, `_id`.
  * Lines 794-855: `/filteredProfiles` loads requester, normalizes filters, uses/sets cache, recycles already-swiped users only if unswiped deck length is zero, then cursor-paginates.
  * Lines 857-895: maps card payload and adds `sharedInterestCount`, `distanceKm`, `activityLabel`. It returns `dateOfBirth` but not computed `age`.
  * Lines 1545-1586: allowed update fields. Important bug: `preferredGender` is not listed even though frontend sends it and model has it.

* `FUSE - BE/api/controllers/SwipeController.js`
  * Lines 104-153: validates swipe, loads logged-in user, target user, like records, active chat, and derives current state.
  * Lines 173-205: dislike updates embedded arrays and closes pending like; dual-writes `SwipeRecord`.
  * Lines 207-248: like upserts `Like`, updates embedded arrays, dual-writes `SwipeRecord`, returns pending if no reciprocal like.
  * Lines 251-291: reciprocal like creates match, updates both profiles, marks likes matched, resolves chat.

* `FUSE - BE/api/lib/swipeStateMachine.js`
  * Lines 7-40: derives `matched`, `disliked`, `liked_pending`, or `neutral`.
  * Lines 42-62: idempotent transitions; repeated matched/disliked actions are no-ops.

* `FUSE - BE/api/models/UserProfile.js`
  * Lines 34-39: `dateOfBirth`, `gender`, `height`, `interests`, `values`.
  * Lines 55-71: `location` and `locationGeo`.
  * Line 108: `preferredGender`.
  * Lines 110-111: `lastActiveAt` for discovery ranking.
  * Lines 114-136: legacy swipe arrays and matches.
  * Lines 157-173: discovery-related indexes.

* `FUSE - BE/api/models/SwipeRecord.js`
  * Lines 5-16: durable per-swipe records with unique `{ swiperId, swipedId }` index.

* `FUSE - BE/api/middleware/authMiddleware.js`
  * Lines 56-63: attaches `req.user` from JWT/database.
  * Lines 65-73: updates `lastActiveAt` at most hourly; this feeds discovery priority.

### Current Actual Filter Behavior

The filter screen is wired to SwipeView on the same device through AsyncStorage only. It does not persist filters server-side and does not sync across devices.

Current saved filter object:

```js
{
  ageRange: { min, max },
  ageFlex: boolean,
  distanceKm: number,
  distanceFlex: boolean,
  interests: string[]
}
```

Current backend behavior is soft ranking, not hard filtering:

* Gender can be a hard Mongo filter, but only if `preferredGender` is actually saved on the user. Currently `ProfileSetup.tsx` sends `preferredGender`, but `updateUserProfile()` ignores it because `preferredGender` is missing from allowed fields.
* Blocked users are hard-excluded.
* Already-swiped users are hard-excluded until the backend finds zero unswiped candidates, then it rebuilds with `excludeSwiped: false` and sets `pagination.recycled = true`.
* Onboarding is hard-filtered to `COMPLETE` plus legacy missing/null/empty onboarding stage.
* Age range is not a hard filter. It only adds score points for candidates inside the selected range.
* Distance is not a hard filter. It only adds score points for candidates within selected kilometers.
* `ageFlex` and `distanceFlex` do not widen or restrict the candidate set. They only change score weights: false = 150 points, true = 80 points.
* Selected filter interests currently do not affect backend scoring or filtering. The backend normalizes `filters.interests`, but `scoreAndRankCandidates()` uses `requester.interests`.
* Distance calculation uses `requester.location.latitude/longitude` and candidate `location.latitude/longitude`. It does not use a Mongo geospatial query.

### Current Priority Ordering Formula

In `scoreAndRankCandidates()`:

* Activity recency: active within 1 day = 300, within 7 days = 200, within 30 days = 100, otherwise 0.
* Shared interests: each shared interest from `requester.interests` adds 20, capped at 200.
* Distance: candidate within `filters.distanceKm` adds 150 if `distanceFlex` is false, 80 if true.
* Age: candidate inside `filters.ageRange` adds 150 if `ageFlex` is false, 80 if true.
* Sort is by total score descending, then `lastActiveAt` descending.

### Current Real-Time And Concurrent Usage State

What is wired:

* Same-device filter changes are detected when returning to `SwipeView` because `activeFiltersKeyRef` is compared with `JSON.stringify(filters || null)`.
* Local duplicate fetches are guarded by `requestInFlightRef`.
* Local duplicate deck resets are guarded by `deckResetInFlightRef`.
* Local duplicate swipe action on the same card is guarded by `swipeActionLockRef`.
* Backend swipe writes use `$addToSet`, unique `Like` index, unique `SwipeRecord` index, and idempotent state transitions.
* Match/chat creation handles duplicate create races by catching duplicate key behavior and re-querying active chat.

What is not wired:

* No websocket/realtime updates exist for swipe deck changes.
* Deck cache is in-memory per Node process, not shared across server instances.
* A cached deck is not invalidated after swipes. Cursor pagination usually prevents already-seen profiles from reappearing in the same local session, but another device/session can still have stale cached cards until force refresh or 15-minute TTL.
* Filters are not stored in `UserProfile`, so another device will not use the same discovery filters.
* If candidate profile data changes after the deck is cached, SwipeView may see stale data until cache expiry/force refresh.

### Highest-Priority Implementation Fixes

1. Add `preferredGender` to `updateUserProfile()` allowed fields so onboarding's preference actually saves.
2. Decide strict vs soft semantics for age, distance, and interests. Current UI wording implies filters/preferences, but backend behavior is soft ranking.
3. Make selected `filters.interests` affect discovery. Use `filters.interests` for shared-interest scoring, and optionally hard-filter or soft-rank depending on product decision.
4. Make `distanceFlex` meaningful. If false, distance should be a hard boundary; if true, backend may widen or only rank more softly.
5. Make `ageFlex` meaningful with the same strict/flexible behavior as distance.
6. Persist discovery filters server-side if filters must work across devices.
7. Invalidate or update the per-user deck cache after swipes, profile updates, and filter changes if concurrent sessions need fresh results.
8. Return computed `age` from `mapProfiles()` or update SwipeView to display age from `dateOfBirth`, because SwipeView expects `profile.age` but backend only returns `dateOfBirth`.

Fuse is already a working dating/social app with phone onboarding, profiles, swipe discovery, likes, accepted chats, notifications, safety tools, video/calling features, and partial backend gift logic.

This document contains:

1. Current completed app context.
2. Completed gift MVP planning context.
3. Important swipe discovery analysis from this session.
4. Best next improvement targets.

---

# 1. Current App State

## 1.1 Product Summary

Fuse is a dating/social discovery app where users:

* Create profiles.
* Complete onboarding.
* Discover other users through swipe cards.
* Like or dislike users.
* Send compliments.
* Form chats after accepted interaction or reciprocal matching.
* Continue conversations safely.
* Use report/block tools.
* Use video/calling features.
* Later send safe platform-approved gifts after genuine chat interaction.

The product direction is not just casual swiping. The core idea is to create safer and more meaningful interaction, where gifts, chats, and video features unlock only after proper user behavior.

---

# 2. Current Tech Stack

## 2.1 Frontend

* Framework: React Native with Expo.
* React version: React 19.1.
* React Native version: React Native 0.81.5.
* Navigation: React Navigation stack and bottom tabs.
* Language: Mixed TypeScript and JavaScript.
* Local storage: AsyncStorage.
* Notifications: Expo Notifications with app-side push manager.
* Realtime chat: Twilio-based realtime layer through `app/realtime/chatRealtime.ts`.
* Video/realtime: Agora and Twilio-related screens exist.
* Styling: Local `StyleSheet` usage.
* Fonts: Poppins.
* Brand color: `#ff5864`.

Important frontend folders:

```txt
fuse/app/screens
fuse/app/api
fuse/app/auth
fuse/app/notifications
fuse/app/realtime
fuse/components
```

---

## 2.2 Backend

* Runtime: Node.js 22.
* Server: Express.
* Module style: ES modules.
* Database: MongoDB with Mongoose.
* Auth: JWT middleware using `UserProfile`.
* Realtime: Socket.io for backend realtime/video queue logic.
* Chat provider: Twilio chat integration.
* Video provider: Agora token generation and video queue support.
* Notifications: Notification service with Expo/FCM/OneSignal provider structure.
* File/media: Multer and S3-related dependencies exist.

Important backend folders:

```txt
FUSE - BE/server.js
FUSE - BE/api/models
FUSE - BE/api/controllers
FUSE - BE/api/routes
FUSE - BE/api/middleware
FUSE - BE/api/services
```

---

# 3. Completed Core Features

## 3.1 Auth and Onboarding

Phone-based auth already exists.

Current flow:

1. User enters phone number.
2. Backend verifies/sends OTP.
3. User verifies OTP.
4. JWT is created.
5. Existing users enter the app.
6. New users complete onboarding.
7. User profile is saved.
8. Main app becomes accessible.

Existing frontend pieces include:

* `AuthGate`
* login screens
* phone verification screens
* code verification screens
* onboarding screens
* location setup screens
* profile setup screens

Backend JWT middleware validates users and attaches `req.user`.

---

## 3.2 Profile System

`UserProfile` stores:

* identity fields
* photos
* prompts
* interests
* preferences
* location
* delivery address
* onboarding/profile completion state

Important note:

`UserProfile.deliveryAddress` already exists and can be used for gift fulfillment.

Privacy rule:

The sender must never see the recipient’s delivery address.

---

## 3.3 Discovery and Matching

Already built:

* Swipe discovery.
* Like/dislike flow.
* Admirer/Liked You flow.
* Match logic.
* Chat creation/reuse after match or accepted compliment.
* Backend like/swipe models, controllers, and routes.

The discovery system currently uses profile details, gender, interests, age, distance, blocking, previous swipes, and pagination.

---

## 3.4 Chat System

Backend has:

* `ChatModel`
* `MessageModel`

Chat statuses include:

```txt
pending
accepted
rejected
closed
```

Current behavior:

* Chat messages are persisted in MongoDB.
* Twilio realtime layer is still used on frontend for live message delivery.
* Chat history is fetched through:

```txt
GET /api/chat/:chatId/messages
```

Message sending persists messages through:

```txt
chatApi.persistMessage
```

---

## 3.5 Safety System

Already built:

* Report user.
* Block user.
* Chat safety menu.
* Backend `Block` model.
* Backend `Report` model.

Important future rule:

Gift feature must be disabled for blocked or reported chats.

---

## 3.6 Notifications

Already built:

* Push token registration.
* Notification routing.
* Gift-related notification types partially exist.
* Navigation support exists for gift screens.

Existing gift-related route targets:

```txt
GiftIntentDetailsScreen
GiftOrderTrackingScreen
```

---

# 4. Existing Gift Backend Context

Gift backend is partially implemented.

## 4.1 Existing Gift Models

```txt
GiftIntentModel.js
GiftPaymentModel.js
GiftOrder.js
```

## 4.2 Existing Gift Controllers

Existing controller functions include:

```txt
createGiftIntent
acceptGiftIntent
rejectGiftIntent
getGiftIntentDetails
initiateGiftPayment
confirmGiftPayment
getSentGifts
getReceivedGifts
getGiftOrderDetails
updateGiftOrderStatus
```

Existing gift routes are mounted under:

```txt
/api/chat
```

---

## 4.3 Current Useful Gift Behavior

Currently implemented behavior:

* Gift intent creation checks that chat is accepted.
* Gift intent creation checks that both users have sent at least one message.
* Payment is currently sender-side.
* Gift order can be created after payment confirmation.
* Recipient delivery address can be snapshotted into the order.
* Sender tracking hides full recipient address.
* Gift notifications are partially wired.

---

# 5. Final Gift MVP Product Decision

The next gift implementation should convert the partial backend into a clean low/mid-cost gift MVP.

## 5.1 Gift MVP Goal

Allow a user to send a safe platform-approved gift from an accepted chat after real two-way interaction, pay first, and let admin manually review and fulfill the order while keeping recipient address private.

---

## 5.2 Build Now

Only build:

* Low-cost gifts.
* Mid-cost gifts.
* Chat-based gift unlock.
* Platform-approved catalog.
* Sender-paid checkout.
* Gift order creation.
* Admin manual review.
* Admin manual fulfillment.
* Sender/recipient order tracking.
* Recipient address privacy.
* Basic admin email/internal alert.

---

## 5.3 Do Not Build Yet

Do not build yet:

* High-cost physical gifts.
* Fuse Experiences marketplace.
* Vendor automation.
* Blinkit/API ordering automation.
* Automatic refunds.
* Anonymous gifts.
* Custom gift messages.
* Gift cards.
* Cash transfer.
* Wallet credit.
* UPI transfers.

---

# 6. Gift MVP Rules

## 6.1 Core Rule

Gifts must never buy:

* attention
* response
* date
* access
* obligation

Gifting should feel like a safe optional gesture after genuine interaction, not a pressure tool.

---

## 6.2 Chat Eligibility Rules

Gift option should appear only when:

* chat is accepted
* both users have sent at least one real message
* users are not blocked
* users are not reported
* chat is not pending, rejected, or closed
* no suspicious/rate-limit condition is active

Gift option should not appear in:

```txt
pending chats
rejected chats
closed chats
blocked chats
reported chats
```

---

## 6.3 Catalog Rules

* Only platform-approved items can be purchased.
* Only `LOW` and `MID` gift tiers are allowed.
* `HIGH` must be removed from normal gift flow.
* High-cost gifting belongs to future Fuse Experiences.
* No cash-equivalent products.
* No sexual products.
* No intimate/romantic pressure products.
* No manipulative/obligation-linked products.

---

## 6.4 Payment Rules

* Sender pays full amount for low and mid gifts.
* Recipient does not pay in this MVP.
* Payment-first flow is allowed.
* After payment, order enters admin review.
* Recipient can decline/cancel before fulfillment.
* If recipient declines before fulfillment, refund should be marked required.

---

## 6.5 Privacy Rules

* Sender must never see recipient address.
* Admin can see recipient delivery details for fulfillment.
* Sender sees only safe order tracking status.
* Public order views should expose only safe metadata if needed, such as city/state/label.

---

## 6.6 Admin Rules

* Admin manually reviews every paid order.
* Admin manually fulfills every approved order.
* Admin can cancel suspicious or unsafe orders.
* Admin can mark refund required.
* Admin status changes must be logged.

---

# 7. Immediate Gift Backend Direction

The next gift implementation should:

1. Normalize gift logic to match final rules.
2. Remove `HIGH` from normal gift flow.
3. Treat `LOW` and `MID` as sender-paid payment-first gifts.
4. Remove old shared-payment/recipient-consent behavior for mid gifts.
5. Add a safe `GiftCatalogItem` model or static catalog source.
6. Stop trusting gift item data from frontend request body.
7. Add active-order restriction per chat.
8. Add proper gift rate limits.
9. Make admin order status updates admin-only.
10. Add admin review/refund-required states.
11. Add admin alert after paid order creation.

---

## 7.1 Suggested Gift Catalog Model

```js
GiftCatalogItem {
  _id,
  name,
  description,
  tier: "LOW" | "MID",
  imageUrl,
  price,
  platformFee,
  deliveryFee,
  finalAmount,
  category,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
}
```

---

# 8. Important Swipe Discovery Analysis

This section is the important analysis completed in the current session.

No code changes were made during this analysis.

The swipe discovery path was analyzed end to end, from frontend fetch behavior to backend filtering, ranking, widening, pagination, and swipe actions.

---

# 9. Swipe Discovery High-Level Flow

Swipe discovery fetches a paginated curated deck from:

```txt
POST /api/profile/filteredProfiles
```

Frontend entry point:

```txt
SwipeView.tsx
Line 235
```

Backend route:

```txt
ProfileRoutes.js
Line 42
```

Backend discovery logic:

```txt
ProfileController.js
Line 993
```

The returned swipe deck is curated using:

* current user gender
* candidate gender
* age range filter
* distance filter
* shared interests
* current user location
* blocked users
* already-swiped users
* onboarding/profile completion state
* recency through `updatedAt`
* pagination state

---

# 10. Frontend Swipe Fetch Behavior

The main frontend screen is:

```txt
SwipeView.tsx
```

Current frontend behavior:

1. Reads JWT from AsyncStorage.
2. Reads `userId` from AsyncStorage.
3. Reads local discovery filters from:

```txt
filters:${userId}
```

4. Sends a request to:

```txt
POST /api/profile/filteredProfiles
```

5. Request body includes:

```js
{
  filters,
  page,
  limit
}
```

6. Page size is currently:

```txt
8
```

7. Prefetch starts when only 3 profiles remain.
8. Active deck is stored in AsyncStorage under:

```txt
swipeDiscoverySession:${userId}
```

9. When returning to the screen, SwipeView restores the previous deck if filters have not changed.

Important frontend lines:

```txt
SwipeView.tsx line 26
SwipeView.tsx line 141
SwipeView.tsx line 235
SwipeView.tsx line 338
SwipeView.tsx line 399
```

---

# 11. Filter Screen Behavior

Filters are currently local-only.

They are not saved to backend.

Important file:

```txt
FilterScreen.tsx
Line 105
```

Current filter fields:

```txt
ageRange
ageFlex
distanceKm
distanceFlex
interests
```

Filter field definition location:

```txt
FilterScreen.tsx
Line 25
```

Important note:

`distanceFlex` is collected on the frontend, but backend does not currently use it.

Frontend location:

```txt
FilterScreen.tsx
Line 112
```

---

# 12. Backend Discovery Logic

Main backend function:

```txt
getFilteredProfiles
```

Location:

```txt
ProfileController.js
Line 993
```

Filter normalization happens here:

```txt
ProfileController.js
Line 565
```

If no interest filter is sent, backend falls back to the current user’s profile interests.

Location:

```txt
ProfileController.js
Line 1009
```

---

# 13. Gender Matching Logic

Current gender preference is hardcoded.

Current logic:

```txt
Man sees Woman
Woman sees Man
Other gender gets no gender filter
```

Location:

```txt
ProfileController.js
Line 596
```

Important improvement needed:

Replace this hardcoded Man/Woman pairing with explicit preferred-gender/orientation settings later.

---

# 14. Base Candidate Filtering

The backend base candidate filter excludes:

* requester themselves
* blocked users
* already-swiped users, unless recycling is enabled
* non-complete profiles
* incomplete onboarding users
* most incomplete accounts, except legacy profiles with missing/null/empty onboarding stage

Important locations:

```txt
ProfileController.js line 623
ProfileController.js line 662
```

---

# 15. Distance Logic

Distance uses:

* MongoDB `2dsphere` through `locationGeo`
* Haversine ranking after candidate fetch

Important locations:

```txt
ProfileController.js line 693
ProfileController.js line 853
```

Current problem:

`distanceFlex` exists on the frontend but is not respected by the backend.

Also, even when distance should be strict, backend eventually widens beyond distance through fallback variants.

---

# 16. Ranking Logic

Profiles are grouped into ranking buckets.

Current ranking buckets:

1. Shared interests and within distance.
2. Shared interests but outside distance.
3. Within distance but no shared interests.
4. Everything else.

Then results are sorted by:

1. bucket
2. score
3. shared interest count
4. within-distance flag
5. `updatedAt`
6. `_id`

Important location:

```txt
ProfileController.js line 717
```

This means the current system is not just filtering. It is a mixed filter + ranking + fallback system.

---

# 17. Discovery Widening Order

Backend tries increasingly broad discovery variants.

Current widening order:

1. age + shared interests + distance
2. age + distance
3. age only
4. expanded age if `ageFlex` is true
5. shared interests + distance
6. shared interests only
7. distance only
8. broad fallback

Location:

```txt
ProfileController.js line 803
```

Important behavior:

If no unswiped profiles are found, backend reruns discovery with:

```js
excludeSwiped: false
```

This recycles previous swipes.

Location:

```txt
ProfileController.js line 1031
```

---

# 18. Important Discovery Gap

The biggest gap found:

```txt
distanceFlex is collected on the frontend but backend does not actually use distanceFlex.
```

This means the frontend gives the user a distance flexibility option, but the backend does not respect it.

Second important gap:

Even when `distanceFlex` is false, backend can still eventually widen beyond distance through fallback variants.

Third important gap:

Age behaves similarly.

`ageFlex` adds a wider `+/- 2` range, but age is not a true hard boundary because later discovery variants remove age entirely.

So current backend behavior treats filters partly as ranking preferences and deck-population hints, not strict user boundaries.

This has to be intentionally decided.

---

# 19. Swipe Actions Flow

Swipe actions go to:

```txt
POST /api/profile/swipe
```

Frontend location:

```txt
SwipeView.tsx line 441
```

Backend location:

```txt
SwipeController.js line 103
```

Swipe state is derived here:

```txt
swipeStateMachine.js line 6
```

---

## 19.1 Like Behavior

When user swipes right / likes:

Backend writes:

* `Like` record
* `swipedUserIds`
* `swipedRight`

If reciprocal like exists:

* both users get matches
* both `Like` records become matched
* accepted chat is created or reused

---

## 19.2 Dislike Behavior

When user swipes left / dislikes:

Backend writes:

* `swipedUserIds`
* `swipedLeft`

This prevents the same profile from immediately returning unless recycling is enabled later by discovery fallback.

---

# 20. Related Files for Swipe Discovery

## 20.1 Core Frontend Files

```txt
SwipeView.tsx line 1
FilterScreen.tsx line 1
Interests.tsx line 15
SwipeActions.ts line 1
ProfileInfoCard.tsx line 218
env.ts line 1
```

---

## 20.2 Profile Data Feeding Discovery

```txt
ProfileSetup.tsx line 57
ProfileDetails.tsx line 120
LocationSetupScreen.tsx line 71
```

These files matter because the data collected here later affects discovery quality.

---

## 20.3 Core Backend Files

```txt
server.js line 61
ProfileRoutes.js line 42
ProfileController.js line 515
SwipeController.js line 103
swipeStateMachine.js line 1
UserProfile.js line 1
Like.js line 1
Block.js line 1
authMiddleware.js line 1
```

---

# 21. Best Improvement Targets for Swipe Discovery

For this feature alone, the strongest improvement targets are:

## 21.1 Make `distanceFlex` Actually Work

Backend must respect:

```txt
distanceFlex: true
distanceFlex: false
```

Suggested meaning:

* `distanceFlex: false` means distance is a hard boundary.
* `distanceFlex: true` means backend can widen distance after strict results run out.

---

## 21.2 Decide Whether Age and Distance Are Hard Filters or Ranking Preferences

Right now, age and distance behave like soft preferences because fallback variants eventually remove them.

This must be made intentional.

Suggested product decision:

Use two modes:

```txt
Strict filter mode
Keep deck populated mode
```

Strict mode:

* Never show profiles outside selected age/distance unless user explicitly allows flexibility.

Keep deck populated mode:

* Use filters first.
* If deck is empty, widen gradually to avoid showing an empty screen.

---

## 21.3 Add Preferred Gender / Orientation Settings

Current backend hardcodes:

```txt
Man sees Woman
Woman sees Man
Other gender sees everyone
```

This should be replaced with user-controlled preference fields.

Possible future fields:

```js
interestedIn: ["Man", "Woman", "Non-binary"]
showMeTo: ["Man", "Woman", "Non-binary"]
orientation
```

This is important for inclusivity and proper discovery accuracy.

---

## 21.4 Persist Discovery Filters Server-Side

Current filters are stored only in AsyncStorage.

Current local key:

```txt
filters:${userId}
```

This means filters may not sync across devices.

If filters should follow the account, store them in backend.

Possible model location:

```js
UserProfile.discoveryPreferences
```

Example:

```js
discoveryPreferences: {
  ageRange: [18, 30],
  ageFlex: false,
  distanceKm: 25,
  distanceFlex: true,
  interests: [],
  strictMode: false
}
```

---

## 21.5 Add More Compatibility Signals

Current discovery heavily uses interests, age, gender, location, and activity.

Future ranking can include:

* values
* dating intentions
* languages
* lifestyle fields
* smoking/drinking preferences
* religion preference if product wants it
* education/work context
* profile completeness
* response quality
* recent activity

Important:

These should improve ranking, not create unfair hard exclusion unless user explicitly sets them as filters.

---

## 21.6 Show Context in Card UI

Swipe cards should eventually show why a profile appeared.

Useful UI context:

* shared interests
* approximate distance
* matching values
* same intention
* active recently

Example labels:

```txt
3 shared interests
8 km away
Also looking for long-term
Recently active
```

This improves trust in discovery.

---

## 21.7 Add Discovery Observability

Backend should log or return debug metadata in development.

Useful metadata:

```js
{
  discoveryBucket: "shared_interests_within_distance",
  matchedInterestsCount: 3,
  withinDistance: true,
  distanceKm: 8.4,
  sourceVariant: "age_interest_distance",
  wasRecycled: false
}
```

This helps debug why a profile appears.

In production, only safe UI metadata should be shown. Internal debug metadata should be protected.

---

## 21.8 Separate Strict Filter Mode from Deck Population Mode

This is the cleanest long-term product fix.

Recommended behavior:

### Strict Mode

If user says filters are strict:

* Do not break age range.
* Do not break distance range.
* Do not ignore selected interests if selected.
* If no profiles exist, show empty-state UI.

Example empty state:

```txt
No profiles match your filters right now.
Try expanding distance, age, or interests.
```

### Keep Deck Populated Mode

If user allows flexibility:

* Use strict matching first.
* Then widen interests/distance/age gradually.
* Clearly rank best matches first.
* Optionally show a label like:

```txt
Slightly outside your distance preference
```

---

# 22. Recommended Next Swipe Discovery Implementation Order

When working on this feature, implement in this order:

## Step 1: Confirm Product Behavior

Decide clearly:

```txt
Should age and distance be hard filters or flexible preferences?
```

Recommended decision:

* If `ageFlex` is false, age should be strict.
* If `distanceFlex` is false, distance should be strict.
* If either flexibility is true, backend may widen that specific field only.
* Add one future setting called `strictDiscoveryMode` if needed.

---

## Step 2: Fix Backend `distanceFlex`

Update backend discovery variants so:

* distance is never removed when `distanceFlex === false`
* distance can widen only when `distanceFlex === true`
* broad fallback should not violate hard distance unless explicitly allowed

---

## Step 3: Fix Age Fallback Behavior

Update backend discovery variants so:

* age is never removed when `ageFlex === false`
* expanded age is used only when `ageFlex === true`
* broad fallback should not violate hard age unless flexibility is enabled

---

## Step 4: Add Discovery Debug Metadata

During development, return metadata showing:

* bucket
* source variant
* whether age was widened
* whether distance was widened
* whether candidate was recycled
* matched interest count

This will make future debugging much easier.

---

## Step 5: Improve UI Context

Update profile cards to show:

* distance
* shared interest count
* maybe matched interest names

This should be added only after backend returns reliable data.

---

# 23. Graphify Rule

This project uses Graphify.

Before codebase changes:

If:

```txt
graphify-out/graph.json
```

exists, use:

```bash
graphify query "<question>"
```

For relationships:

```bash
graphify path "<A>" "<B>"
```

For focused concepts:

```bash
graphify explain "<concept>"
```

For broad navigation:

```txt
graphify-out/wiki/index.md
```

Use:

```txt
GRAPH_REPORT.md
```

only when query/path/explain is not enough.

After modifying code, run:

```bash
graphify update .
```

---

# 24. Final Note for Claude

The gift MVP context is already shortened and finalized above.

The most important new context from this session is the swipe discovery analysis.

Before making swipe discovery changes, do not randomly edit files. First inspect the exact files listed above, especially:

```txt
SwipeView.tsx
FilterScreen.tsx
ProfileRoutes.js
ProfileController.js
SwipeController.js
swipeStateMachine.js
UserProfile.js
Like.js
Block.js
authMiddleware.js
```

The first technical fix should be around making `distanceFlex` and `ageFlex` behave consistently with product expectations.

The current backend discovery system is powerful but slightly unclear because filters sometimes behave like strict filters and sometimes behave like soft ranking preferences. The next implementation should make this behavior explicit and predictable.
