# Fuse Current App Status + Next Gift MVP Implementation Plan

## 0. Purpose of This Note

This note is for Claude before starting the next implementation phase.

The existing Fuse product is already a working dating/social app with onboarding, profiles, swiping, chats, notifications, safety tools, video features, and partial backend gift logic. The next phase should convert the current partial gift backend into a clear MVP gift flow with frontend integration.

---

## 1. Current Product Summary

Fuse is a dating app where users create profiles, discover people, send compliments, form accepted chats, and continue conversations safely.

- **Core product:** Dating and matchmaking app with swipe-style discovery and chat-based interaction.
- **User flow:** Phone verification, onboarding, profile details, location setup, photos, prompts, and then main app access.
- **Matching flow:** Users can like, view admirers, match, and move into chat.
- **Chat flow:** Chat requests can be pending or accepted, and full chat behavior is controlled by chat status.
- **Safety flow:** Users can report or block someone from inside chat.
- **Gift direction:** Gifts should only unlock after genuine accepted chat interaction, not as a way to buy attention.

---

## 2. Current Tech Stack

## 2.1 Frontend

- **Framework:** React Native with Expo.
- **React version:** React 19.1.
- **React Native version:** React Native 0.81.5.
- **Navigation:** React Navigation stack and bottom tabs.
- **Language:** Mixed TypeScript and JavaScript.
- **Storage:** AsyncStorage for local auth/session values.
- **Notifications:** Expo Notifications with app-side push manager.
- **Realtime chat:** Twilio-based realtime layer through `app/realtime/chatRealtime.ts`.
- **Video/realtime:** Agora and Twilio-related screens exist for video/calling features.
- **Styling:** Local `StyleSheet` usage with Poppins fonts and Fuse brand color `#ff5864`.

Relevant frontend folders:

- `fuse/app/screens` - main screen implementations.
- `fuse/app/api` - frontend API wrappers.
- `fuse/app/auth` - auth client and authenticated fetch helper.
- `fuse/app/notifications` - notification routing, token registration, push handling.
- `fuse/app/realtime` - realtime chat/video helpers.
- `fuse/components` - reusable UI components.

---

## 2.2 Backend

- **Runtime:** Node.js 22.
- **Server:** Express.
- **Module style:** ES modules.
- **Database:** MongoDB with Mongoose.
- **Realtime:** Socket.io for backend realtime/video queue logic.
- **Chat provider:** Twilio chat integration.
- **Video provider:** Agora token generation and video queue support.
- **Notifications:** Notification service with Expo/FCM/OneSignal provider structure.
- **File/media:** Multer and S3-related dependencies exist for uploads.
- **Auth:** JWT middleware using `UserProfile`.

Relevant backend folders:

- `FUSE - BE/server.js` - Express app setup and route mounting.
- `FUSE - BE/api/models` - Mongoose models.
- `FUSE - BE/api/controllers` - route business logic.
- `FUSE - BE/api/routes` - Express routes.
- `FUSE - BE/api/middleware` - auth, upload, rate limit, socket middleware.
- `FUSE - BE/api/services` - Twilio and notification services.

---

## 3. What Has Already Been Built

## 3.1 Auth and Onboarding

- Phone-based auth exists through backend auth routes.
- JWT auth middleware validates users and attaches `req.user`.
- Frontend has `AuthGate`, login, phone verification, code verification, and onboarding screens.
- Delivery/location setup exists through `LocationSetupScreen` and `UpdateDeliveryLocation`.

## 3.2 Profile System

- `UserProfile` stores basic profile identity, photos, prompts, interests, preferences, location, and delivery address.
- Delivery address is already stored in `UserProfile.deliveryAddress`.
- This address is important for gift fulfillment, but it must never be exposed to the sender.

## 3.3 Discovery and Matching

- Swipe, like, admirer, and match screens exist.
- Backend has like/swipe controllers and related models.
- Match/chat transition already exists through chat creation and chat list screens.

## 3.4 Chat System

- Backend has `ChatModel` and `MessageModel`.
- Chat statuses include `pending`, `accepted`, `rejected`, and `closed`.
- Chat messages are persisted in MongoDB.
- Twilio realtime chat is still used on the frontend for live message delivery.
- Chat history is fetched through `/api/chat/:chatId/messages`.
- Sending a message persists it through `chatApi.persistMessage`.

## 3.5 Safety System

- Chat safety actions exist for block and report.
- Frontend `ChatScreen` has a safety menu with report and block actions.
- Backend has `Block` and `Report` models.
- Block/report should disable gifting in the next phase.

## 3.6 Notifications

- Notification token registration and navigation routing exist.
- Gift-related notification types already exist.
- Notifications can route to `GiftIntentDetailsScreen` and `GiftOrderTrackingScreen`.

## 3.7 Existing Gift Backend Work

Gift backend is partially implemented already.

Existing models:

- `GiftIntentModel.js` - stores a proposed gift intent.
- `GiftPaymentModel.js` - stores payment records for gift intents.
- `GiftOrder.js` - stores created gift orders and delivery snapshots.

Existing controllers:

- `createGiftIntent` in `ChatController.js`.
- `acceptGiftIntent` in `ChatController.js`.
- `rejectGiftIntent` in `ChatController.js`.
- `getGiftIntentDetails` in `ChatController.js`.
- `initiateGiftPayment` in `GiftPaymentController.js`.
- `confirmGiftPayment` in `GiftPaymentController.js`.
- `getSentGifts`, `getReceivedGifts`, `getGiftOrderDetails`, and `updateGiftOrderStatus` in `GiftTrackingController.js`.

Existing gift routes are mounted under `/api/chat`.

Current useful backend behavior:

- Gift intent creation checks that chat is accepted.
- Gift intent creation checks that both users have sent at least one message.
- Payment is currently single-payer sender-side.
- Gift order can be created after payment confirmation.
- Recipient delivery address can be snapshotted into the order.
- Order tracking hides full recipient address from sender.
- Gift notifications are already partially wired.

---

## 4. Current Gaps Before Next Phase

These gaps should be fixed before building a polished frontend.

- **No frontend catalog:** There is no product catalog screen for choosing low/mid gifts.
- **No gift button in chat:** `ChatScreen` does not yet expose a gift entry point.
- **No frontend checkout flow:** There is no cart, checkout, or payment-confirmation UI.
- **No gift API wrapper:** Gift calls are currently direct fetches inside screens, not centralized in `app/api`.
- **No admin portal:** Admin cannot review, approve, process, deliver, cancel, or refund orders from a portal.
- **No admin auth guard:** Current status update route allows participants for testing and must become admin-only.
- **Gift states are incomplete:** Current order states are `CREATED`, `PROCESSING`, `DISPATCHED`, `DELIVERED`, `FAILED`, `CANCELLED`, but final rules need admin review and refund states.
- **Old high-tier gift logic remains:** Current gift tiering still allows `HIGH` inside gifts, but final product decision says high-cost belongs to Fuse Experiences, not the gift catalog.
- **Mid-cost consent mismatch:** Existing code still treats mid/high as recipient-consent flows, while latest final decision says low and mid gifts are both payment-first, with recipient decline/cancel before fulfillment.
- **No catalog model:** Gift items are accepted from request body, which is unsafe for real product prices.
- **No active-order restriction:** Backend does not fully enforce one active gift order per chat.
- **No full rate limits:** Low daily limit exists, but weekly/monthly limits and mid-cost limits need implementation.
- **No real payment gateway verification:** `confirmGiftPayment` currently trusts frontend/webhook input and needs proper provider verification later.
- **No admin email alert:** Admin notification/email alert is not yet implemented.

---

# 5. Next Implementation Phase: Gift MVP

## 5.1 Phase Goal

Build the first safe Fuse gift MVP for low-cost and mid-cost gifts inside accepted chats.

One-line goal:

> Let a user send a safe platform-approved gift from an accepted chat after real two-way interaction, pay first, and let admin manually review and fulfill the order while keeping recipient address private.

---

## 5.2 MVP Scope

Build only:

- Low-cost gifts.
- Mid-cost gifts.
- Chat-based gift unlock.
- Platform-approved catalog.
- Cart/checkout basics.
- Sender-paid payment flow.
- Gift order creation.
- Admin manual review and fulfillment.
- Sender/recipient order tracking.
- Recipient address privacy.
- Basic admin email alert or internal notification.

Do not build yet:

- High-cost physical gifts.
- Full Fuse Experiences marketplace.
- Vendor automation.
- Blinkit/API ordering automation.
- Automatic refunds.
- Anonymous gifts.
- Custom gift messages.
- Gift cards, cash, wallet credit, or UPI transfers.

---

# 6. Product Rules Claude Must Follow

## 6.1 Core Rule

Gift payment must never buy attention, response, date, access, or obligation.

## 6.2 Chat Eligibility

- Gifting must only appear inside accepted chats.
- Gifting must unlock only after both users have sent at least one real message.
- Gifting must not appear in pending, rejected, closed, blocked, or reported chats.
- Gifting must be disabled if suspicious activity or rate limits are triggered.

## 6.3 Catalog Rules

- Only platform-approved items can be purchased.
- Low and mid gifts are allowed.
- High-cost items must not appear in the gift catalog.
- No cash-equivalent products are allowed.
- No sexual, intimate, manipulative, or obligation-linked products are allowed.

## 6.4 Payment Rules

- Sender pays full amount for low and mid gifts.
- Recipient does not pay in this MVP.
- Payment-first is allowed.
- After payment, the order enters admin review.
- Recipient can decline/cancel before fulfillment.
- If recipient declines before fulfillment, refund should be marked required.

## 6.5 Privacy Rules

- Sender must never see recipient address.
- Admin can see recipient delivery details for fulfillment.
- Sender only sees safe tracking status.
- Public order views should expose only safe address metadata like city/state/label if needed.

## 6.6 Admin Rules

- Admin manually reviews every paid order.
- Admin manually fulfills every approved order.
- Admin can cancel/refund any suspicious or unsafe order.
- Admin status changes must be logged.

---

# 7. Backend Implementation Plan

## 7.1 Normalize Gift Product Decision

Update backend gift logic to match the final product rules.

- Remove `HIGH` from normal gift flow because high-cost is reserved for future Fuse Experiences.
- Treat `LOW` and `MID` as sender-paid payment-first gifts.
- Remove recipient shared payment logic from MVP behavior.
- Keep recipient decline/cancel only before fulfillment, not as required pre-payment approval.

## 7.2 Add Gift Catalog Model or Static Catalog

Create a safe source of truth for gift items.

Suggested model:

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
