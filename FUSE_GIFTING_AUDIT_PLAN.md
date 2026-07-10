# Fuse Gifting Phase — Audit & Production Plan

> Scope: the **gifting** subsystem only (Phase 2). The base dating app (auth, swipe,
> onboarding, chat, video, safety) is out of scope here — it is audited separately and
> corrections are handled per its own priority.
>
> Target end-state: **full real-money gifting, live for users.** Anything that cannot be
> fully finished without an external account or an app rebuild is **tagged COMING SOON** and
> gated OFF so users never hit a half-built flow.
>
> Last updated: 2026-07-10

---

## 0. TL;DR — the one rule

After **G1**, a user can never hit a broken or dead-end gift flow. The gift entry point is
either **fully working** or shows a clean **"Gifting — coming soon"** state. Every phase after
G1 is safe to ship incrementally. Real money turns on with a **single flag flip** once Razorpay
keys + native SDK + rebuild land.

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
| P2-1 | Empty/error states pass on catalog / My Gifts / tracking. | screens | Minor. |
| P2-2 | Legacy `GIFT_INTENT_RECEIVED/ACCEPTED/REJECTED` notif types still exist (point to old screen). | `notificationTypes.js` | Not breaking; deep-link fallback handles it. |

---

## 3. COMING SOON tags (tell users, don't fake)

| Feature | Why not fully done | Interim |
|---------|--------------------|---------|
| **Gifting (whole feature) live for real money** | Needs Razorpay account + keys, native `react-native-razorpay` install, app rebuild, and the native build (`libworklets.so`) fixed. | Gate OFF → users see "Gifting — coming soon." Code is real-money-ready; one flag flip to enable. |
| **Automatic refunds** | No gateway auto-refund wired. | Admin issues refund in Razorpay dashboard, then flips order to `REFUNDED`. Documented SOP. Auto-refund API = later. |

---

## 4. Staged plan

Ordered so **nothing hangs for users at any phase boundary.**

### G1 — "Nothing hangs" foundation (frontend, no blocker)
- Fix checkout dead-end (P1-1) → proper error state, never a 404 tracking screen.
- Eligibility refreshes on chat focus (P1-2).
- Empty/error states (P2-1).
- **`giftingEnabled` server-driven gate** (P1-4): off → 🎁 becomes "Gifting — coming soon", nothing
  downstream reachable. This is the safety valve.
- **Exit criteria:** app is shippable with gifting either running or "coming soon"; zero hanging threads.

### G2 — Ops backbone (backend)
- Wire the gift flow to `opsAlertService.alertNewGiftOrder` (email + WhatsApp + push) on **paid order**
  and on **recipient decline** (P0-2, P0-3, P0-4).
- Set `ADMIN_USER_IDS` so admin push/email actually fire.
- **Exit criteria:** every paid order and every decline reaches a channel ops watches.

### G3 — Admin dashboard (backend-served website)
- `public/admin/gifts.html`, same pattern as `explore.html`: laptop browser, paste admin JWT,
  order queue (Needs review / In progress / Refunds owed / Done), full delivery address, one-click
  transitions, `addressMissing` / `REFUND_REQUIRED` flagged loud (P0-5).
- **Exit criteria:** an operator can run the full fulfillment loop without Postman.

### G4 — Catalog images
- Source 12 clean royalty-free product images → upload to `fuseupload-photos` S3 → re-seed URLs (P1-3).
- **Exit criteria:** real images render for all items.

### G5 — Real payments (pilot → production gate)
- Razorpay: install native SDK, add keys, wire the checkout sheet, `GIFT_PAYMENT_MODE=RAZORPAY`.
  HMAC verify is already stubbed and ready.
- **Exit criteria:** real charge succeeds → order created → flip `giftingEnabled` ON.

### G6 — End-to-end verification
- Two real users + admin loop on a device: eligibility → catalog → pay → order → admin approve →
  fulfill → deliver → decline/refund (P0-1). Depends on native build fixed.
- **Exit criteria:** the whole loop observed working on device.

---

## 5. External / manual inputs needed

| Need | Unblocks | Level | Owner |
|------|----------|-------|-------|
| **Mongo user `_id`** (admin) | G2 alerts + push | Hard — alerts dead without it | You |
| **Razorpay `KEY_ID` + `KEY_SECRET`** (test keys fine to start) | G5 | Only if real money now | You |
| **Twilio WhatsApp sender** number | G2 WhatsApp channel | Soft — email works without it | You |
| Approve **12 sourced images** | G4 | Soft | You |
| Fix **native build** (`libworklets.so`) | G6 device test | Hard for G6 only | Build infra |
| Run **S3 upload script** + **catalog re-seed** | G4 | Env can't reach S3/Atlas from here | You run locally |

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
| G1 — Nothing-hangs foundation | ☐ Not started | No blockers |
| G2 — Ops backbone | ☐ Not started | Needs Mongo `_id` |
| G3 — Admin dashboard | ☐ Not started | — |
| G4 — Catalog images | ☐ Not started | You run S3 script |
| G5 — Real payments | ☐ Not started | Needs Razorpay keys + rebuild |
| G6 — E2E verification | ☐ Not started | Needs native build fix |
