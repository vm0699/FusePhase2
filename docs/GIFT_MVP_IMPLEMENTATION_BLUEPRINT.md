# Gift MVP Implementation Blueprint for Claude

## 0. Purpose

This file gives Claude a structured implementation platform for the Fuse Gift MVP.

The goal is not only to describe product rules, but to help Claude reason exactly about:

* existing backend routes
* missing backend routes
* required controller functions
* required model fields
* frontend API wrappers
* frontend screens
* navigation changes
* admin routes
* eligibility logic
* safety and privacy rules
* exact testing path

Claude must read this file before implementing any gift-related feature.

---

# 1. Product Goal

Build a safe gift MVP inside accepted Fuse chats.

Final MVP journey:

Accepted Chat
→ Gift eligibility check
→ Gift button unlocks
→ Gift catalog
→ Checkout
→ Sender pays
→ Gift order enters admin review
→ Admin manually approves/processes/fulfills
→ Sender and recipient track safe status
→ Recipient can decline before fulfillment
→ Sender never sees recipient address

---

# 2. Hard Product Rules

## 2.1 Allowed Gift Types

Allowed in this MVP:

* LOW gifts
* MID gifts

Not allowed in this MVP:

* HIGH gifts
* cash
* gift cards
* UPI/cash transfer
* sexual/intimate gifts
* obligation-linked gifts
* anonymous gifts
* custom unsafe messages

High-cost gifting must be moved to future Fuse Experiences, not this gift catalog.

---

## 2.2 Chat Eligibility Rules

Gifting is allowed only when:

* Chat exists.
* Current user is a chat participant.
* Chat status is `accepted`.
* Both users have sent at least one real message.
* Neither user has blocked the other.
* No active safety/report restriction exists.
* There is no active gift order already in the chat.
* Sender has not crossed rate limits.

Gifting is disabled when:

* Chat is `pending`.
* Chat is `rejected`.
* Chat is `closed`.
* Chat is blocked.
* Chat has active safety hold/report restriction.
* Both users have not chatted.
* Active gift order already exists.
* Rate limit exceeded.

---

## 2.3 Payment Rules

* Sender pays full amount.
* Recipient pays nothing.
* LOW and MID both use payment-first flow.
* Recipient consent before payment is not required in MVP.
* After payment, order status becomes `ADMIN_REVIEW`.
* Admin manually decides whether to approve, process, fulfill, cancel, or refund.
* Recipient can decline/cancel before fulfillment.
* If recipient declines after payment but before fulfillment, order becomes `REFUND_REQUIRED`.

---

## 2.4 Privacy Rules

* Sender must never see recipient full address.
* Admin can see recipient delivery snapshot.
* Recipient can see their own delivery label/city if needed.
* Sender sees only safe tracking status.
* Logs must not print full address publicly.
* API response must change depending on viewer role.

---

# 3. Existing Backend Areas to Inspect First

Claude must inspect these files before editing:

```txt
FUSE - BE/server.js
FUSE - BE/api/routes/ChatRoutes.js
FUSE - BE/api/controllers/ChatController.js
FUSE - BE/api/controllers/GiftPaymentController.js
FUSE - BE/api/controllers/GiftTrackingController.js
FUSE - BE/api/models/GiftIntentModel.js
FUSE - BE/api/models/GiftPaymentModel.js
FUSE - BE/api/models/GiftOrder.js
FUSE - BE/api/models/ChatModel.js
FUSE - BE/api/models/MessageModel.js
FUSE - BE/api/models/UserProfile.js
FUSE - BE/api/models/Block.js
FUSE - BE/api/models/Report.js
FUSE - BE/api/middleware/authMiddleware.js
```

Claude must answer these before coding:

1. What gift routes already exist?
2. What controller functions already exist?
3. What fields already exist in GiftIntentModel?
4. What fields already exist in GiftOrder?
5. How does ChatModel store participants?
6. How does MessageModel store sender/chatId?
7. How does Block model represent blocked users?
8. How does Report model represent active reports?
9. How does UserProfile store deliveryAddress?
10. How are notification functions called?

---

# 4. Backend Implementation Map

## 4.1 New Backend Models

### 4.1.1 GiftCatalogItem

Suggested file:

```txt
FUSE - BE/api/models/GiftCatalogItem.js
```

Suggested fields:

```js
{
  name: String,
  description: String,
  tier: "LOW" | "MID",
  imageUrl: String,
  price: Number,
  platformFee: Number,
  deliveryFee: Number,
  finalAmount: Number,
  category: String,
  isActive: Boolean,
  sortOrder: Number,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

Rules:

* Frontend must not send price.
* Backend calculates final amount from catalog item.
* Only active LOW/MID items can be used.
* HIGH must be rejected.

---

## 4.2 New Backend Middleware

### 4.2.1 adminMiddleware

Suggested file:

```txt
FUSE - BE/api/middleware/adminMiddleware.js
```

Suggested function:

```js
export const adminMiddleware = async (req, res, next) => {
  // authMiddleware should run before this
  // Option 1: check req.user.isAdmin
  // Option 2: check process.env.ADMIN_USER_IDS
  // Option 3: check process.env.ADMIN_PHONE_NUMBERS
};
```

Recommended MVP:

Use `ADMIN_USER_IDS` or `ADMIN_PHONE_NUMBERS` from `.env` first.

Do not depend on frontend-only admin flags.

---

## 4.3 New Backend Routes

### 4.3.1 Gift Catalog Routes

Suggested file:

```txt
FUSE - BE/api/routes/GiftRoutes.js
```

Routes:

```txt
GET /api/gifts/catalog
GET /api/gifts/catalog/:itemId
POST /api/gifts/orders/:orderId/decline
```

Controller file:

```txt
FUSE - BE/api/controllers/GiftCatalogController.js
```

Suggested functions:

```js
export const getGiftCatalog = async (req, res) => {};
export const getGiftCatalogItem = async (req, res) => {};
export const declineGiftOrder = async (req, res) => {};
```

Mount in:

```txt
FUSE - BE/server.js
```

Suggested mount:

```js
app.use("/api/gifts", giftRoutes);
```

---

### 4.3.2 Admin Gift Routes

Suggested file:

```txt
FUSE - BE/api/routes/AdminGiftRoutes.js
```

Routes:

```txt
GET /api/admin/gifts/orders
GET /api/admin/gifts/orders/:orderId
PATCH /api/admin/gifts/orders/:orderId/status
PATCH /api/admin/gifts/orders/:orderId/notes
```

Controller file:

```txt
FUSE - BE/api/controllers/AdminGiftController.js
```

Suggested functions:

```js
export const getAdminGiftOrders = async (req, res) => {};
export const getAdminGiftOrderDetails = async (req, res) => {};
export const updateAdminGiftOrderStatus = async (req, res) => {};
export const updateAdminGiftOrderNotes = async (req, res) => {};
```

Mount in:

```txt
FUSE - BE/server.js
```

Suggested mount:

```js
app.use("/api/admin/gifts", authMiddleware, adminMiddleware, adminGiftRoutes);
```

---

## 4.4 Existing Chat Gift Routes to Update

Inspect current route names first.

Expected current or suggested routes:

```txt
POST /api/chat/:chatId/gift-intent
GET /api/chat/:chatId/gift/eligibility
GET /api/chat/gift-intent/:intentId
POST /api/chat/gift-intent/:intentId/pay
POST /api/chat/gift-intent/:intentId/pay/confirm
GET /api/chat/gifts/order/:orderId
```

Suggested controller functions:

```js
export const getGiftEligibility = async (req, res) => {};
export const createGiftIntent = async (req, res) => {};
export const getGiftIntentDetails = async (req, res) => {};
export const initiateGiftPayment = async (req, res) => {};
export const confirmGiftPayment = async (req, res) => {};
export const getGiftOrderDetails = async (req, res) => {};
```

---

# 5. Backend Function Logic

## 5.1 getGiftEligibility(chatId)

Suggested file:

```txt
FUSE - BE/api/controllers/ChatController.js
```

Function:

```js
export const getGiftEligibility = async (req, res) => {};
```

Required checks:

1. Find chat by `chatId`.
2. Confirm `req.user._id` is participant.
3. Confirm chat status is `accepted`.
4. Count messages by participant A.
5. Count messages by participant B.
6. Confirm both message counts are greater than zero.
7. Check Block collection both directions.
8. Check Report collection for active/safety-blocking reports if supported.
9. Check active GiftOrder for same chat.
10. Check LOW/MID rate limits.
11. Return structured response.

Suggested response:

```js
{
  eligible: true,
  reason: null,
  chatStatus: "accepted",
  bothUsersChatted: true,
  activeOrderExists: false,
  limits: {
    low: {
      canSend: true,
      reason: null
    },
    mid: {
      canSend: true,
      reason: null
    }
  }
}
```

Failure response example:

```js
{
  eligible: false,
  reason: "BOTH_USERS_MUST_CHAT_FIRST",
  chatStatus: "accepted",
  bothUsersChatted: false,
  activeOrderExists: false
}
```

Suggested reason codes:

```txt
CHAT_NOT_FOUND
NOT_CHAT_PARTICIPANT
CHAT_NOT_ACCEPTED
BOTH_USERS_MUST_CHAT_FIRST
BLOCKED_CHAT
SAFETY_HOLD
ACTIVE_ORDER_EXISTS
LOW_LIMIT_REACHED
MID_LIMIT_REACHED
UNKNOWN_ERROR
```

---

## 5.2 createGiftIntent(chatId)

Suggested file:

```txt
FUSE - BE/api/controllers/ChatController.js
```

Function:

```js
export const createGiftIntent = async (req, res) => {};
```

Request body:

```js
{
  catalogItemId: "mongoId",
  quantity: 1
}
```

Rules:

1. Current user must be sender.
2. Recipient is the other chat participant.
3. Chat must pass eligibility.
4. Catalog item must exist.
5. Catalog item must be active.
6. Catalog item tier must be LOW or MID.
7. Reject HIGH.
8. Quantity should be 1 for MVP.
9. Calculate price on backend.
10. Store catalog snapshot inside intent.
11. Store senderId, recipientId, chatId.
12. `requiresRecipientPayment = false`.
13. `requiresRecipientConsent = false`.
14. status should be `CREATED`.

Suggested response:

```js
{
  success: true,
  intent: {
    _id,
    chatId,
    senderId,
    recipientId,
    status: "CREATED",
    catalogItemSnapshot,
    amountBreakdown
  }
}
```

---

## 5.3 initiateGiftPayment(intentId)

Suggested file:

```txt
FUSE - BE/api/controllers/GiftPaymentController.js
```

Function:

```js
export const initiateGiftPayment = async (req, res) => {};
```

Rules:

1. Only sender can initiate payment.
2. Intent must be CREATED.
3. Payment amount must come from intent amount.
4. Create GiftPayment record.
5. For placeholder mode, return test payment object.
6. For real mode later, return provider order.

Suggested placeholder response:

```js
{
  success: true,
  paymentMode: "PLACEHOLDER",
  paymentId,
  amount,
  currency: "INR"
}
```

---

## 5.4 confirmGiftPayment(intentId)

Suggested file:

```txt
FUSE - BE/api/controllers/GiftPaymentController.js
```

Function:

```js
export const confirmGiftPayment = async (req, res) => {};
```

Rules:

1. Only sender can confirm.
2. Verify payment if real provider mode is enabled.
3. For local placeholder mode, accept only in development.
4. Mark GiftPayment as SUCCESS.
5. Mark GiftIntent as PAID.
6. Create GiftOrder.
7. Snapshot recipient delivery address from UserProfile.
8. Order status should become `ADMIN_REVIEW`.
9. Send notification/admin alert.
10. Return order ID.

Suggested response:

```js
{
  success: true,
  intentStatus: "PAID",
  order: {
    _id,
    status: "ADMIN_REVIEW"
  }
}
```

---

## 5.5 declineGiftOrder(orderId)

Suggested file:

```txt
FUSE - BE/api/controllers/GiftCatalogController.js
```

or better:

```txt
FUSE - BE/api/controllers/GiftTrackingController.js
```

Function:

```js
export const declineGiftOrder = async (req, res) => {};
```

Rules:

1. Only recipient can decline.
2. Decline allowed only before `FULFILLED` or `DELIVERED`.
3. If payment exists, status becomes `REFUND_REQUIRED`.
4. If no payment exists, status becomes `CANCELLED`.
5. Sender gets notification.
6. Do not expose recipient reason unless product explicitly decides later.

---

## 5.6 updateAdminGiftOrderStatus(orderId)

Suggested file:

```txt
FUSE - BE/api/controllers/AdminGiftController.js
```

Function:

```js
export const updateAdminGiftOrderStatus = async (req, res) => {};
```

Allowed actions:

```txt
APPROVE
MARK_PROCESSING
MARK_FULFILLED
MARK_DELIVERED
CANCEL
MARK_REFUND_REQUIRED
MARK_REFUNDED
```

Status mapping:

```js
APPROVE -> APPROVED
MARK_PROCESSING -> PROCESSING
MARK_FULFILLED -> FULFILLED
MARK_DELIVERED -> DELIVERED
CANCEL -> CANCELLED
MARK_REFUND_REQUIRED -> REFUND_REQUIRED
MARK_REFUNDED -> REFUNDED
```

Rules:

1. Admin only.
2. Log every status change.
3. Validate allowed status transitions.
4. Notify sender/recipient when important.
5. Admin route can expose full delivery snapshot.
6. Participant route cannot expose full delivery snapshot.

---

# 6. Gift Order States

Use this MVP state list:

```txt
CREATED
PAID
ADMIN_REVIEW
APPROVED
PROCESSING
FULFILLED
DELIVERED
CANCELLED
REFUND_REQUIRED
REFUNDED
```

Terminal states:

```txt
DELIVERED
CANCELLED
REFUNDED
```

Active order states:

```txt
CREATED
PAID
ADMIN_REVIEW
APPROVED
PROCESSING
FULFILLED
REFUND_REQUIRED
```

Active order check:

There should be only one active gift order per chat.

---

# 7. Rate Limit Rules

Minimum MVP limits:

```txt
LOW:
- max 1 gift per chat per day
- max 2 gifts per sender per week across all chats

MID:
- max 1 gift per chat per week
- max 2 gifts per sender per month across all chats
```

Suggested helper functions:

```js
async function checkGiftRateLimits({ senderId, chatId, tier }) {}
async function hasActiveGiftOrder(chatId) {}
async function bothUsersHaveChatted(chatId, participantIds) {}
async function hasBlockBetweenUsers(userA, userB) {}
async function hasSafetyHoldBetweenUsers(userA, userB) {}
```

Suggested location:

```txt
FUSE - BE/api/services/giftEligibilityService.js
```

or inside controller first, then refactor if large.

---

# 8. Frontend Implementation Map

## 8.1 New Frontend API File

Create:

```txt
fuse/app/api/giftApi.ts
```

Suggested functions:

```ts
export async function getGiftEligibility(chatId: string) {}

export async function getGiftCatalog() {}

export async function getGiftCatalogItem(itemId: string) {}

export async function createGiftIntent(
  chatId: string,
  payload: { catalogItemId: string; quantity?: number }
) {}

export async function getGiftIntent(intentId: string) {}

export async function initiateGiftPayment(intentId: string) {}

export async function confirmGiftPayment(
  intentId: string,
  payload: {
    paymentId?: string;
    provider?: string;
    testMode?: boolean;
  }
) {}

export async function getGiftOrder(orderId: string) {}

export async function getSentGifts() {}

export async function getReceivedGifts() {}

export async function declineGiftOrder(orderId: string) {}
```

Rules:

* Use `API_BASE_URL` from `app/config/env.ts`.
* Use existing authenticated fetch helper if available.
* Do not duplicate auth token logic if `authFetch`/`authenticatedFetch` exists.

---

## 8.2 Update ChatScreen

File:

```txt
fuse/app/screens/ChatScreen.tsx
```

Add behavior:

1. Load gift eligibility after chat is loaded.
2. Show gift button if eligible.
3. Show locked gift state if chat accepted but both users have not chatted.
4. Hide gift if pending/rejected/closed/blocked/reported.
5. On gift button press, navigate to GiftCatalogScreen.

Navigation params:

```ts
navigation.navigate("GiftCatalog", {
  chatId,
  recipientId,
  recipientName
});
```

Do not block normal chat behavior.

Do not change existing message sending logic unless required.

---

## 8.3 New GiftCatalogScreen

Create:

```txt
fuse/app/screens/GiftCatalogScreen.tsx
```

MVP UI:

* Header
* Back button
* Low/Mid tabs
* Gift cards
* Safety disclaimer
* Select button

Required API calls:

```ts
getGiftEligibility(chatId)
getGiftCatalog()
```

On select:

```ts
navigation.navigate("GiftCheckout", {
  chatId,
  catalogItemId
});
```

---

## 8.4 New GiftCheckoutScreen

Create:

```txt
fuse/app/screens/GiftCheckoutScreen.tsx
```

MVP UI:

* Gift summary
* Price breakdown
* Recipient privacy note
* “Confirm & Pay” button
* Loading/error states

Flow:

```txt
createGiftIntent
→ initiateGiftPayment
→ confirmGiftPayment
→ navigate to GiftOrderTrackingScreen
```

Placeholder payment mode allowed only for local/dev testing.

---

## 8.5 Update GiftOrderTrackingScreen

File:

```txt
fuse/app/screens/GiftOrderTrackingScreen.tsx
```

Add support for statuses:

```txt
ADMIN_REVIEW
APPROVED
PROCESSING
FULFILLED
DELIVERED
CANCELLED
REFUND_REQUIRED
REFUNDED
```

Sender-safe labels:

```txt
ADMIN_REVIEW = "Under admin review"
APPROVED = "Approved"
PROCESSING = "Being prepared"
FULFILLED = "Fulfilled by Fuse"
DELIVERED = "Delivered"
CANCELLED = "Cancelled"
REFUND_REQUIRED = "Refund required"
REFUNDED = "Refunded"
```

Rules:

* Do not display full recipient address to sender.
* Recipient can decline before fulfillment/delivery.
* Show clear manual fulfillment explanation.

---

## 8.6 Update GiftIntentDetailsScreen

File:

```txt
fuse/app/screens/GiftIntentDetailsScreen.tsx
```

Required changes:

* Remove old mid/high recipient-payment assumption.
* LOW and MID both sender-paid.
* If paid order exists, show tracking button.
* Keep as notification/deep-link fallback.

---

## 8.7 Update Navigation

File:

```txt
fuse/AppNav.js
```

Add screens:

```js
<Stack.Screen name="GiftCatalog" component={GiftCatalogScreen} />
<Stack.Screen name="GiftCheckout" component={GiftCheckoutScreen} />
```

Verify existing names for:

```txt
GiftIntentDetailsScreen
GiftOrderTrackingScreen
```

Do not rename existing registered screens unless needed.

---

# 9. Admin MVP

Recommended MVP approach:

Start backend-only admin routes first.

Build React Native admin screen only after backend admin routes work.

Optional admin frontend files:

```txt
fuse/app/screens/AdminGiftOrdersScreen.tsx
fuse/app/screens/AdminGiftOrderDetailsScreen.tsx
```

Admin screen can be hidden behind admin user check.

Do not expose admin routes to normal users.

---

# 10. Backend File Change Checklist

## New files likely needed

```txt
FUSE - BE/api/models/GiftCatalogItem.js
FUSE - BE/api/controllers/GiftCatalogController.js
FUSE - BE/api/controllers/AdminGiftController.js
FUSE - BE/api/routes/GiftRoutes.js
FUSE - BE/api/routes/AdminGiftRoutes.js
FUSE - BE/api/middleware/adminMiddleware.js
FUSE - BE/api/services/adminAlertService.js
FUSE - BE/api/services/giftEligibilityService.js
```

## Existing files likely updated

```txt
FUSE - BE/server.js
FUSE - BE/api/routes/ChatRoutes.js
FUSE - BE/api/controllers/ChatController.js
FUSE - BE/api/controllers/GiftPaymentController.js
FUSE - BE/api/controllers/GiftTrackingController.js
FUSE - BE/api/models/GiftIntentModel.js
FUSE - BE/api/models/GiftPaymentModel.js
FUSE - BE/api/models/GiftOrder.js
FUSE - BE/api/models/UserProfile.js
```

Claude must inspect exact current files before editing.

---

# 11. Frontend File Change Checklist

## New files likely needed

```txt
fuse/app/api/giftApi.ts
fuse/app/screens/GiftCatalogScreen.tsx
fuse/app/screens/GiftCheckoutScreen.tsx
```

Optional:

```txt
fuse/components/GiftProductCard.tsx
fuse/components/GiftStatusBadge.tsx
fuse/app/screens/AdminGiftOrdersScreen.tsx
fuse/app/screens/AdminGiftOrderDetailsScreen.tsx
```

## Existing files likely updated

```txt
fuse/AppNav.js
fuse/app/screens/ChatScreen.tsx
fuse/app/screens/GiftIntentDetailsScreen.tsx
fuse/app/screens/GiftOrderTrackingScreen.tsx
fuse/app/notifications/notificationNavigation.ts
```

Claude must inspect exact current files before editing.

---

# 12. Stage-by-Stage Build Plan

## Stage 1: Inspect Existing Gift System

Claude should not code yet.

Output required:

```txt
Existing routes:
Existing controller functions:
Existing models and fields:
Existing frontend screens:
Existing notification routes:
Current mismatches with MVP:
```

---

## Stage 2: Backend Rule Cleanup

Implement:

* LOW/MID only
* Remove HIGH from normal gift flow
* Payment-first for LOW/MID
* Recipient does not pay
* Admin review after payment
* New order states

---

## Stage 3: Catalog Source of Truth

Implement:

* GiftCatalogItem model or static catalog
* GET catalog routes
* Backend price calculation
* Reject frontend-defined prices

---

## Stage 4: Eligibility API

Implement:

```txt
GET /api/chat/:chatId/gift/eligibility
```

Checks:

* accepted chat
* both users chatted
* block/report
* active order
* rate limits

---

## Stage 5: Payment-to-Order Flow

Implement:

* create intent using catalog item
* initiate payment
* confirm payment
* create order
* snapshot recipient address
* status ADMIN_REVIEW
* admin alert

---

## Stage 6: Admin Backend

Implement:

* admin middleware
* order list
* order detail
* update status
* admin notes
* refund-required/refunded marking

---

## Stage 7: Frontend Gift API

Implement:

```txt
fuse/app/api/giftApi.ts
```

Use centralized auth fetch.

---

## Stage 8: Chat Gift Entry

Implement in ChatScreen:

* eligibility fetch
* gift button
* locked state
* navigation to catalog

---

## Stage 9: Catalog and Checkout Screens

Implement:

* GiftCatalogScreen
* GiftCheckoutScreen
* payment placeholder mode
* navigate to tracking

---

## Stage 10: Tracking and Recipient Controls

Update:

* GiftOrderTrackingScreen
* GiftIntentDetailsScreen
* notification navigation if needed

---

# 13. Test Cases

Claude must test or provide exact test steps for:

```txt
1. Pending chat cannot gift.
2. Rejected chat cannot gift.
3. Closed chat cannot gift.
4. Accepted chat without both users chatting cannot gift.
5. Accepted chat with both users chatting can gift.
6. Blocked chat disables gift.
7. Reported/safety-held chat disables gift.
8. LOW gift creates intent.
9. MID gift creates intent.
10. HIGH gift is rejected.
11. Frontend cannot override price.
12. Sender can initiate payment.
13. Recipient cannot initiate payment.
14. Payment confirmation creates GiftOrder.
15. Order becomes ADMIN_REVIEW.
16. Sender cannot see recipient address.
17. Recipient can decline before fulfillment.
18. Decline after payment becomes REFUND_REQUIRED.
19. Admin can approve/process/fulfill/deliver.
20. Normal user cannot update admin status.
21. Only one active gift order per chat.
22. Rate limits are enforced.
23. Gift tracking loads from notification.
24. Sent gifts and received gifts load correctly.
```

---

# 14. Claude Output Format During Implementation

For every coding step, Claude must respond with:

```txt
What I inspected:
What I found:
Files changed:
Routes added/updated:
Functions added/updated:
Models changed:
Frontend screens changed:
How to test:
Risk notes:
Next step:
```

Claude must not say “done” without test steps.

---

# 15. First Prompt to Give Claude

Use this as the first message to Claude after creating this file:

```txt
Read CLAUDE.md and docs/GIFT_MVP_IMPLEMENTATION_BLUEPRINT.md first.

Do not code yet.

Use Graphify first to inspect the existing gift-related backend and frontend flow.

Then return:
1. existing gift routes
2. existing gift models and fields
3. existing controller functions
4. existing frontend gift screens
5. exact mismatches with the Gift MVP blueprint
6. exact stage-by-stage implementation plan based on the current code
7. files that need changes in Stage 1 only

After that, wait for my approval before editing.
```
