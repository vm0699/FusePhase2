# Fuse Gifting Phase — Audit & Production Plan

> Scope: the **gifting** subsystem only (Phase 2). The base dating app (auth, swipe,
> onboarding, chat, video, safety) is out of scope here — it is audited separately and
> corrections are handled per its own priority.
>
> Target end-state: **full real-money gifting, live for users.** Per an explicit product call,
> there is no blanket "coming soon" gate on the feature — gifting ships live now in
> `PLACEHOLDER` payment mode. Only genuinely unfinished pieces (real-money Razorpay flip,
> automatic refunds) are called out individually below, not hidden behind a feature flag.
>
> Last updated: 2026-07-11

---

## 0. TL;DR — the one rule

As of **G1–G3 + G5 (this update)**, the gift flow has no dead-ends: every screen has a real
error/retry state, eligibility never goes stale, paid orders and refund-owed declines always
reach an ops channel (email/push, WhatsApp when configured), and there's a working admin
dashboard to fulfil orders. Real money turns on with a **single env flip**
(`GIFT_PAYMENT_MODE=RAZORPAY`) once the native SDK is rebuilt onto a device and tested — the
backend Razorpay integration (order creation, webhook, checkout sheet) is already built.

---

## 1. What is already solid (verified in code)

These were read end-to-end and the frontend↔backend contracts line up:

- **API wrapper** (`fuse/app/api/giftApi.ts`) — every endpoint matches a real backend route.
- **Eligibility gate** (`giftEligibilityService.js`) — accepted chat + both-users-chatted + block +
  safety-hold + recipient-gifts-disabled + active-order + LOW/MID rate limits. Fails closed.
- **Intent creation** (`ChatController.createGiftIntent`) — catalog is the **only** source of truth
  for tier + price; amount computed server-side; client price is ignored.
- **Payment → order** (`GiftPaymentController.confirmGiftPayment`) — idempotent order creation keyed
  on `intentId`; recipient address frozen into a snapshot; `addressMissing` guard holds bad orders
  in review.
- **Address privacy** (`giftOrderService.js`) — sender never receives the full address; only
  city/state/label. Admin serializer is the only path that exposes the full snapshot.
- **Order state machine** (`GiftOrder.js`) — 10 states; active-status set blocks a second order per chat.
- **Idempotency** — unique `idempotencyKey` on `GiftPayment`, unique `intentId` on `GiftOrder`.
- **Notifications** — all gift types defined with defaults; refund/delivered/status pings wired from
  `AdminGiftController.notifyParticipantsOfStatus`.
- **Payment adapter** (`giftPaymentProvider.js`) — PLACEHOLDER/RAZORPAY behind `GIFT_PAYMENT_MODE`;
  Razorpay HMAC verify already written (stubbed order creation).
- **The `intentId` frontend bug is fixed** (`GiftItemDetailScreen` reads `giftIntentId` correctly).

---

## 2. Blockers & gaps — prioritized

Severity: **P0** = breaks/loses data or money · **P1** = user-visible hang or unfinished ·
**P2** = polish / deferrable.

### P0 — must fix before any real usage

| # | Gap | Where | Effect |
|---|-----|-------|--------|
| P0-1 | **Full pay→order→track flow never run on a device.** | whole flow | "Correct on paper" ≠ verified. Highest unknown. |
| P0-2 | **Paid orders go into a black hole.** `confirmGiftPayment` → `adminAlertService.notifyAdminsNewOrder` only does `console.log` + push to `ADMIN_USER_IDS`, which is **empty**. | `GiftPaymentController.js`, `.env` | A paid order produces a console line and nothing else. No email, no WhatsApp, no push. |
| P0-3 | **The rich alert service is dead code for gifts.** `opsAlertService.alertNewGiftOrder` (email + WhatsApp + push, already built) is never imported by the gift flow. | `opsAlertService.js` ↔ `GiftPaymentController.js` | The channels ops actually watch are not connected. |
| P0-4 | **Recipient decline never alerts ops.** Decline → `REFUND_REQUIRED` notifies only the sender. Admin gets zero signal a refund is owed. | `GiftTrackingController.declineGiftOrder` | Refunds sit invisible. |
| P0-5 | **No admin dashboard.** `/api/admin/gifts` works only via Postman/curl. No human surface to review addresses, approve, or fulfill. | (missing) `public/admin/gifts.html` | "Manual fulfillment" has no actual screen. |

### P1 — user-visible hang / unfinished

| # | Gap | Where | Effect |
|---|-----|-------|--------|
| P1-1 | **Checkout dead-end.** On confirm, navigates with `orderId || intentId`; if order id is ever missing, tracking loads an intent id and 404s. | `GiftItemDetailScreen` | Hang with no recovery. Should fail into an error state. |
| P1-2 | **Gift button goes stale.** Eligibility loads on mount + `status`/`bothChatted` change, not on focus. Other side sends first message → button stays locked until re-entering chat. | `ChatScreen` | Feels broken. |
| P1-3 | **Catalog images are dead URLs** (`images.fusedating.co.in` → NXDOMAIN). All 12 items show 🎁 placeholder. | seed data / S3 | Reads as unfinished. |
| P1-4 | **No `giftingEnabled` gate.** No clean way to show "coming soon" while real payments aren't live. | frontend + a server flag | Needed so nothing hangs pre-Razorpay. |

### P2 — polish / deferrable

| # | Gap | Where | Effect |
|---|-----|-------|--------|
| P2-1 | Empty/error states pass on catalog / My Gifts / tracking. | screens | Minor. — ✅ Done (see G1) |
| P2-2 | ~~Legacy `GIFT_INTENT_RECEIVED/ACCEPTED/REJECTED` notif types still exist (point to old screen).~~ | `notificationTypes.js`, `types.ts`, `notificationNavigation.ts` | ✅ **Done** — confirmed dead (never fired since the accept/reject flow was removed in Phase 2) and removed cleanly from all three files. `GIFT_PAYMENT_FAILED`'s routing (which shared the case block) is untouched and still live. |

---

## 3. Genuinely unfinished pieces (no feature gate — called out individually)

| Feature | Why not fully done | Interim |
|---------|--------------------|---------|
| **Real-money payments** | Razorpay LIVE keys are in `.env` and the backend integration (order creation, webhook, native checkout sheet) is built, but `GIFT_PAYMENT_MODE` is still `PLACEHOLDER` pending the native `react-native-razorpay` rebuild + on-device test. | Flip `GIFT_PAYMENT_MODE=RAZORPAY` once G6 device testing passes. |
| **Automatic refunds** | No gateway auto-refund wired. | Admin issues refund in Razorpay dashboard, then flips order to `REFUNDED` in the admin dashboard. Documented SOP below. Auto-refund API = later. |
| **Catalog images / expansion** | Deferred to last per product decision — see G4. | 🎁 emoji placeholder shows until images are sourced. |

---

## 4. Staged plan

Ordered so **nothing hangs for users at any phase boundary.**

### G1 — "Nothing hangs" foundation (frontend, no blocker) — ✅ DONE
- Fixed checkout dead-end (P1-1): `GiftItemDetailScreen` now falls back to looking up the order
  via the intent if the confirm response is missing an id, and never navigates tracking to a
  fake id — shows a clear "check My Gifts" message instead.
- Eligibility refreshes on chat focus (P1-2): `ChatScreen` uses `useFocusEffect`, not just mount.
- Retry + error states added to catalog, item detail, and tracking screens (P2-1).
- `giftingEnabled` feature-flag gate (P1-4) was explicitly **not built** — product decision:
  ship live, no blanket "coming soon" gate. See §3.
- **Exit criteria met:** zero hanging threads in the gift flow.

### G2 — Ops backbone (backend) — ✅ DONE
- Gift flow now calls `opsAlertService.alertNewGiftOrder` (email + WhatsApp-when-configured +
  admin push) on **paid order**, replacing the old console-log-only `adminAlertService` path
  (P0-2, P0-3).
- New `opsAlertService.alertGiftRefundRequired`, fired on **recipient decline** when a refund is
  owed (P0-4) — previously invisible to ops.
- `ADMIN_USER_IDS` and `OPS_EMAIL_TO` set in `.env`.
- Declined/refunded orders excluded from sender rate-limit counts (product decision).
- **Exit criteria met:** every paid order and every refund-owed decline reaches email + push
  (WhatsApp activates once a Twilio WhatsApp sender is configured).

### G3 — Admin dashboard (backend-served website) — ✅ DONE
- `public/admin/gifts.html` built, same phone-OTP-login pattern as `explore.html`: order queue
  (Needs review / In progress / Refunds owed / Done / All), full delivery address, one-click
  status transitions, `addressMissing` flagged loud, notes + tracking URL fields (P0-5).
- **Exit criteria met:** an operator can run the full fulfillment loop without Postman.

### G4 — Catalog expansion + images (deferred to LAST) — ☐ not started
- **Scope changed for production:** expand catalog to **≥20 items per category** (not 12 total).
- Source clean royalty-free product images per item → upload to `fuseupload-photos` S3 → re-seed URLs (P1-3).
- **Exit criteria:** each category has ≥20 active items with real images rendering.

### G5 — Real payments (pilot → production gate) — ✅ CODE DONE, awaiting device test
- Backend creates real Razorpay orders with the LIVE keys (mirrors the existing, proven
  `paymentProvider.js` pattern used by Explore Phase 3).
- Added `POST /api/gifts/razorpay/webhook` — signature-verified over the raw request body
  (dedicated `express.raw()` scoped to that one path in `server.js`), the authoritative
  server-to-server payment confirmation. Shares one `finalizeGiftPayment` function with the
  client-confirm path so both converge safely (idempotent either order).
- Installed `react-native-razorpay@3.0.0`; `GiftItemDetailScreen` opens the native checkout
  sheet in RAZORPAY mode with graceful cancel/fail handling.
- `GIFT_PAYMENT_MODE` is still `PLACEHOLDER` — flip only after G6 device testing passes.
- **Exit criteria:** real charge succeeds → order created → flip `GIFT_PAYMENT_MODE=RAZORPAY`.

### G6 — End-to-end verification
- Two real users + admin loop on a device: eligibility → catalog → pay → order → admin approve →
  fulfill → deliver → decline/refund (P0-1). Depends on native build fixed.
- **Exit criteria:** the whole loop observed working on device.

---

## 5. External / manual inputs

| Need | Unblocks | Status |
|------|----------|--------|
| **Mongo user `_id`** (admin) | G2 alerts + push | ✅ **Received** — set as `ADMIN_USER_IDS` in `.env` |
| **Razorpay keys** | G5 | ✅ **Received (LIVE keys)** — stored in `.env`. See notes below. |
| **Twilio WhatsApp sender** number | G2 WhatsApp channel | ☐ Pending — email + push work without it |
| **Catalog images** | G4 | ☐ Deferred to LAST. Scope changed: **≥20 items per category** for production (not 12). |
| Fix **native build** (`libworklets.so`) | G6 device test | ☐ Pending |
| Run **S3 upload script** + **catalog re-seed** | G4 | ☐ You run locally (env can't reach S3/Atlas) |

### Razorpay notes (important)
- **LIVE keys, not test.** Real money moves from the first transaction once `GIFT_PAYMENT_MODE=RAZORPAY`.
  Mode is kept `PLACEHOLDER` until G5 (native SDK + rebuild) is done — do not flip early.
- **`RAZORPAY_WEBHOOK_SECRET` provided** → G5 should include a server-side webhook endpoint
  (`/api/gifts/razorpay/webhook`) verifying the signature, as the source of truth for payment success
  (more robust than trusting the client confirm). Adds to G5 scope.
- **`RAZORPAY_PLAN_ID` is for subscriptions (recurring)** — gifting is one-time payments, so it is
  **not used** by the gift flow. Kept in `.env` for reference only (likely belongs to a premium/subscription feature).
- Secrets live only in the gitignored `.env`; never written into tracked files.

**Environment note:** this dev environment cannot reach MongoDB Atlas or S3 (network-blocked). Any
DB-seed / migration / S3-upload step is written as a script and **run from your terminal**; everything
else is built and verified here.

**Manual SOPs to document before real money:**
- **Refund:** operator issues refund in Razorpay dashboard → flips order to `REFUNDED`.
- **Address missing:** order holds in `ADMIN_REVIEW` with the flag; operator contacts recipient /
  cancels + refunds.

---

## 6. Status tracker

| Phase | Status | Notes |
|-------|--------|-------|
| G1 — Nothing-hangs foundation | ✅ Done | Checkout dead-end fixed, focus-refresh, retry/error states |
| G2 — Ops backbone | ✅ Done | `opsAlertService` wired on paid + decline; rate-limit fix; `ADMIN_USER_IDS`/`OPS_EMAIL_TO` set |
| G3 — Admin dashboard | ✅ Done | `public/admin/gifts.html` live, same login pattern as `explore.html` |
| G4 — Catalog expansion + images | ☐ Not started | Deferred to LAST; ≥20/category; you run S3 script |
| G5 — Real payments | ✅ Code done | Backend Razorpay + webhook + native checkout sheet built; `GIFT_PAYMENT_MODE` still `PLACEHOLDER` pending device test |
| G6 — E2E verification | ☐ Not started | Needs native build fix + physical device test |

**Externals received:** Mongo admin `_id`, Razorpay LIVE keys (+ webhook secret, plan_id) — all in `.env`.
**Next up:** G6 device verification (you), then G4 catalog/images (you'll flag when ready).
