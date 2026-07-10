# Fuse Base App — Production Readiness Audit

Scope: the **original app before gifting and Explore** — auth, onboarding, profile,
swipe discovery, likes, chat, video/calling, safety (block/report), notifications,
uploads, and cross-cutting server concerns (CORS, headers, rate limits, secrets,
logging, deps).

This audit was done by reading the code directly (paths + line numbers below), not
from assumptions. Discovery/filter behaviour is already documented in `CLAUDE.md` and
was largely resolved by the discovery upgrade; this doc focuses on everything *else*
that was never audited, plus a few discovery items that are still open.

Severity key: **P0 = ship-blocker**, **P1 = high (fix before real users)**,
**P2 = medium (fix soon after launch)**, **P3 = deferral / hardening**.

---

## 0. Executive summary

The chat/safety authorization layer is genuinely solid — block checks and participant
checks are consistent across every chat endpoint. Swipe/match writes are idempotent and
race-safe. Secrets are **not** committed (`.env` is gitignored).

But there are two hard blockers and several high-severity gaps that were never looked at:

- **Auth can be fully bypassed** — valid JWTs are handed out on the *send-OTP* step,
  before the OTP is ever verified.
- **No server-side 18+ enforcement** — a legal + app-store blocker for a dating app.
- **Socket video queue and video/chat tokens are effectively unauthenticated at the
  room/channel level.**

Details and a copy-pasteable TODO list follow.

---

## P0 — Ship blockers

### [x] P0-1 — Authentication bypass: tokens issued before OTP verification (FIXED)
`FUSE - BE/api/controllers/authController.js:46-64` and `:102-120`

`verifyPhoneNumber` is the **"send OTP"** step, but it already signs and returns a real
`accessToken` + `refreshToken` for the matched user — *before any code is verified*.

Impact: anyone who POSTs a known/guessed phone number to
`/api/auth/verifyPhoneNumber` receives fully valid tokens and can act as that user. This
is complete account takeover of every existing account, and free account creation for
any number. The OTP step (`verifyCode`) becomes cosmetic.

Fix:
- The send step must return only `{ exists, onboardingStage }` — **no tokens**.
- Issue tokens **only** in `verifyCode` / `verifyEmailOTPHandler` after Twilio/email
  verification returns approved (that code path already exists and is correct).

**Fix applied (2026-07-10):** Removed both `jwt.sign(...)` blocks and the
`accessToken`/`refreshToken` fields from `verifyPhoneNumber`'s responses
(existing-user and new-user branches). `verifyCode` was already the correct
issuance point and was left untouched. Verified the frontend never reads
`accessToken`/`refreshToken` from `verifyPhoneNumber`'s response — the only
call site (`fuse/app/screens/PhoneVerif.tsx:75`) only reads `result.data.exists`;
tokens are saved exclusively in `fuse/app/screens/CodeVerif.tsx:117` from the
`verifyCode` response — so this fix does not change any frontend behavior.
Note: `newUser` account rows are still created on this pre-verification step
(tracked separately as P1-6); only token issuance was in scope here.

### [ ] P0-2 — No server-side minimum-age (18+) enforcement
Client check only: `fuse/app/screens/Intro.tsx:42` (and it's *year-only* — someone who
is 17 but turns 18 later this calendar year passes). Backend accepts any `dateOfBirth`
string with zero validation (`ProfileController.js:1643` allowed field; model stores a
free `String` at `UserProfile.js:45`).

Impact: the age gate is trivially bypassed by a modified client or a direct API call,
and even the honest path is imprecise. For a dating app this is a legal/compliance and
Apple/Google review blocker.

Fix:
- Validate `dateOfBirth` server-side (format + real date) and compute exact age ≥ 18 on
  every profile update that sets it.
- Refuse to transition `onboardingStage` to `COMPLETE` without a valid adult DOB.
- Tighten the client check to use the full date, not just the year.

---

## P1 — High

### [x] P1-1 — Socket.IO video queue trusts client-supplied userId (no auth) (FIXED)
`FUSE - BE/server.js:543-584` — `join_video_queue` reads `userId` straight from the
socket payload. Sockets are never authenticated (no JWT handshake).

Impact: any client can join/leave the queue as **any** userId, hijack another user's
queue entry, and get matched into video calls under their identity.

Fix: authenticate the socket connection (JWT in `io.use(...)` handshake) and derive
`userId` from the verified token, never from the event payload.

**Fix applied (2026-07-10):** Added `io.use((socket, next) => {...})` in
`server.js` that verifies a JWT (from `socket.handshake.auth.token`, with
query/header fallback) using the same `JWT_SECRET` as HTTP auth, and sets
`socket.data.userId` from the decoded id. `join_video_queue` and
`leave_video_queue` now read `socket.data.userId` exclusively and ignore any
`userId` in the event payload. On the frontend, `fuse/app/screens/WaitingScreen.tsx`
now fetches the JWT from AsyncStorage before connecting and passes it as
`io(SERVER_URL, { auth: { token: jwtToken } })`; verified the `userId` route
param passed into this screen was already always derived from the same JWT
(`VideoInitiateScreen.tsx:112` decodes it client-side) or from the queue-cycle
`userId` (`vAgoraCallScreen.tsx:98`), so the authenticated value and the old
payload value are identical for every legitimate call — no behavior change,
only spoofing is closed.

### [x] P1-2 — Video/chat tokens are not bound to an authorized room/channel (FIXED)
- Agora RTC: `agoraRoutes.js:45-86` mints a PUBLISHER token for **any** `channelName`
  the caller passes.
- Twilio Video: `VideoController.js:38` grants a `VideoGrant` for **any** `room` from
  the body.
- Twilio Chat: `ChatController.js:688` issues a **service-wide** `ChatGrant` (no channel
  scoping).

Impact: any authenticated user who learns or guesses a room/channel id can join a
private call, and with a service-wide chat grant can attach to arbitrary channels via
the Twilio SDK. Room ids are random, which reduces but does not remove the risk.

Fix: verify the requester is a legitimate participant of the room/channel *before*
issuing the token, and scope grants to that specific room/channel.

**Fix applied (2026-07-10):**
- `agoraRoutes.js` `/token` and `VideoController.generateVideoToken` both now
  query `VideoQueueEntry` for a `status: "matched"` record whose `roomId`
  equals the requested `channelName`/`room` and whose `userId` or
  `matchedUserId` equals `req.user.id`; if none exists, they return 403
  before minting a token. This reuses the existing video-queue match record
  (no new schema), and doesn't affect the real flow since every legitimate
  room comes from a `match_found` event backed by exactly this record.
  Confirmed `/api/video/token` (Twilio Video) has no live frontend caller
  today (`VideoCallScreen.tsx`/`TwilioNativeCallScreen.tsx` expect `room`/
  `twilioToken` route params that nothing currently supplies) — hardened
  anyway since the route is live and directly callable.
- Twilio Chat: investigated separately, since `ChatGrant` genuinely cannot be
  scoped to one channel (that's how Twilio Programmable Chat works — access
  is controlled by channel membership, not the grant). Found the real gap:
  `chatTwilioService.js`'s `service.channels.create(...)` never set `type`,
  which defaults to Twilio's **public** channel type — meaning any user
  holding a valid (service-wide) chat token could join a channel by SID
  without being server-added as a member, if they ever obtained that SID.
  Added `type: "private"` to the channel-creation call so Twilio itself
  enforces that only the two participants added via `ensureChannelMembers`
  can join. This only affects newly created channels going forward —
  channels created before this fix remain public (Twilio does not support
  changing `type` after creation); flagged as a residual note below.

### [x] P1-3 — Sensitive data written to logs (FIXED)
- OTP codes: `authController.js:156` and `:298`, `otpService.js:38`.
- Full `Authorization` header + decoded JWT on every request:
  `authMiddleware.js:5,8,24`.
- Phone numbers and issued tokens throughout auth.

Impact: anyone with log access (or a log aggregator/3rd-party) can read OTPs, tokens,
and PII → account takeover and privacy breach.

Fix: remove or gate all sensitive `console.log`s behind `NODE_ENV !== 'production'`;
never log OTPs, tokens, or full auth headers.

**Fix applied (2026-07-10):** Redacted the OTP `code` value in the two
"Incoming" logs in `authController.js` (`verifyCode`, `verifyEmailOTPHandler`)
and in `otpService.js`'s verify log — none now print the literal code. Removed
the full `req.headers` dump, the full `Authorization` header log, and the
decoded-JWT dump from `authMiddleware.js` (the "Token missing required fields"
warning was also changed to stop printing the decoded payload). Left benign
operational logs (phone number without the code, "Tokens issued" markers with
no token value, user id lookups) as-is — these don't expose a secret and
removing them would lose useful debugging signal for a much larger diff than
necessary. A broader log-level/production-gating pass is still a P3 item if
wanted.

### [ ] P1-4 — Missing baseline HTTP hardening
`server.js:52-61` — no `helmet`, no global error handler, no 404 handler, no
`express-mongo-sanitize`; `cors({ origin: '*' })`; JSON/urlencoded body limit `50mb`.

Impact: missing security headers, verbose error/stack leakage, permissive CORS, and a
large body limit (DoS / memory pressure).

Fix: add `helmet`, restrict CORS to known origins, add `express-mongo-sanitize`, lower
the body limit (≈1–2mb for JSON; uploads go through multer separately), and add a
central error handler + 404.

### [ ] P1-5 — Rate limiting is IP-based, per-process, and proxy-unaware
`FUSE - BE/api/middleware/rateLimit.js` — in-memory `Map`, keyed on `req.ip`. No
`app.set('trust proxy', ...)` is configured.

Impact: (a) behind a load balancer/proxy every user shares the proxy IP → mass
over-throttling or, with `X-Forwarded-For` spoofing, easy bypass; (b) with more than one
Node instance the counters don't aggregate → limits are effectively multiplied. The
OTP-send limiter is the one that matters most — this gates SMS cost / SMS-bombing.

Fix: set `trust proxy`, move buckets to a shared store (Redis) for multi-instance, and
additionally key the OTP-send limiter by phone/email, not just IP.

### [x] P1-6 — New user row created before OTP verification (FIXED)
`authController.js:91` creates a `UserProfile` on the *send-OTP* step.

Impact: unbounded creation of unverified accounts (DB pollution), and it compounds
P0-1. Also the differing `exists:true/false` response enables phone-number enumeration.

Fix: create the user only after successful verification (or create as `unverified` and
sweep unclaimed rows); make the send response shape identical regardless of existence.

**Fix applied (2026-07-10):** `verifyPhoneNumber`'s new-number branch no longer
creates a `UserProfile` row — it only sends the OTP and returns
`{ exists: false, onboardingStage: "PHONE_VERIFIED", user: null }`. The account
is now created inside `verifyCode`, via an atomic
`findOneAndUpdate(..., { upsert: true, setDefaultsOnInsert: true })` that runs
only after `verifyOTP()` returns `true` — this also closes a theoretical
duplicate-key race if the endpoint were ever hit twice concurrently for the
same number. Verified `PhoneVerif.tsx:97` (the only consumer of this response)
only reads `result.data.exists`, never `result.data.user`, so returning
`user: null` for brand-new numbers doesn't change frontend behavior. Chose
"create only after verification" over "identical response shape" — the
existence-revealing `exists` flag is a much lower-severity concern than
DB pollution/number-squatting (and is now moot for account *takeover* purposes
since P0-1 already removed token issuance from this step); changing the
response shape would have required auditing every consumer of `exists` for a
marginal privacy gain, so it was left as a deferral (documented above).

---

## P2 — Medium

### [x] P2-1 — Account deletion is incomplete (orphaned data + push to dead users) (FIXED)
`FUSE - BE/api/controllers/UserController.js:166-235` deletes the profile, Likes, Chats,
and swipe-array references — but **not** `Message`, `SwipeRecord`, `Block`, `Report`,
`DeviceToken`, or any gift/event data.

Impact: orphaned messages and swipe records remain; `DeviceToken` survival means push
notifications can still be sent to a deleted user; GDPR/right-to-erasure gap.

Fix: cascade-delete every collection keyed on the user id (Message by their chats,
SwipeRecord both directions, Block, Report, DeviceToken, notifications, etc.).

**Fix applied (2026-07-10):** `deleteAccount` in `UserController.js` now: (1)
captures the user's chat ids *before* deleting the chats, then deletes every
`Message` with a matching `chatId`; (2) deletes `SwipeRecord` in both
directions (`swiperId`/`swipedId`); (3) deletes `Block` in both directions
(`blockerId`/`blockedId`); (4) deletes `Report` in both directions
(`reporterId`/`reportedUserId`); (5) deletes all `DeviceToken` rows for the
user, so push notifications can never be sent to a deleted account. Gift/event
data was intentionally left out — those subsystems are outside this audit's
base-app scope. Response shape (`{ success, message }`) is unchanged; verified
the only frontend caller (`Settings.tsx:124`) only checks `res.ok` and never
reads the body, so nothing on the client depends on this change.

### [ ] P2-2 — Profile photos: public URLs + EXIF/GPS not stripped
`FUSE - BE/api/controllers/ProfilePhotoController.js:66-88` uploads originals to S3 and
returns public-read URLs. No EXIF stripping / re-encode.

Impact: profile images are enumerable by direct URL with no auth, and original EXIF may
carry GPS coordinates — a real location leak for a dating app.

Fix: re-encode/strip metadata on upload (e.g. `sharp`), and consider private objects +
signed URLs.

### [ ] P2-3 — Upload type check is client-declared mimetype only
`FUSE - BE/api/middleware/FileUpload.js:8-17` trusts `file.mimetype` (the client's
Content-Type), no magic-byte validation.

Fix: validate the actual file signature after upload; reject mismatches.

### [x] P2-4 — "Liked You" doesn't exclude blocked users (FIXED)
`FUSE - BE/api/routes/likeRoutes.js` (`/likedyou`) excludes users you already have chats
with, but not users in the `Block` collection.

Impact: a blocked person's Like still appears in the target's "Liked You" list.

Fix: filter out both directions of `Block` (reuse `getBlockedCounterpartIds`).

**Fix applied (2026-07-10):** Added a local `getBlockedCounterpartIds` helper
to `likeRoutes.js` (same logic as `ChatController.js`'s version, kept as a
self-contained copy rather than importing from `ChatController.js` to avoid
pulling in that file's heavier Twilio/S3/gift-service dependency graph into a
lightweight route file). It's now merged into the existing `excludedUserIds`
set that already gates the `Like`-based entries, and separately checked
against the `pendingChats` (compliment-request) entries before they're mapped
into the response. Response shape is unchanged — blocked users are simply
absent from the `users` array, same as the existing chat-exclusion behavior.

### [ ] P2-5 — No NoSQL-injection guard on request bodies
Request-body values flow into queries (`email`, `phoneNumber`, ids). Mongoose casting +
`.trim()` blunt most object-injection, but there's no systemic guard.

Fix: add `express-mongo-sanitize` (also listed in P1-4) and type-check string inputs.

### [ ] P2-6 — Dependency / supply-chain cleanup
`FUSE - BE/package.json`:
- `nodeman` — not `nodemon`; looks like a stray/typosquat-adjacent package, unused.
- `aws-sdk` v2 (deprecated/maintenance) present alongside `@aws-sdk/client-s3` v3.
- `dns` — userland package shadowing the Node core module; unnecessary.
- `multer@1.4.5-lts.1` — 1.x line is deprecated and has advisories.

Fix: remove `nodeman`, `dns`, and `aws-sdk` v2; upgrade `multer` to 2.x; run
`npm audit` and pin.

### [ ] P2-7 — No length caps on user-generated text
Chat messages, compliments, and profile text fields are unbounded (the only limit is the
50mb body). Storage-abuse and UI-break surface.

Fix: enforce sane max lengths server-side (e.g. message ≤ 2–4k chars).

---

## P3 — Deferrals / hardening / verify

- [ ] **P3-1** Frontend stores JWTs in `AsyncStorage` (plaintext) — move to
  `expo-secure-store` / Keychain. (`fuse/app/auth/*`)
- [ ] **P3-2** `refresh-token` endpoint has no rate limit (`auth.js:43`).
- [ ] **P3-3** `updateLocation` rejects valid `0` lat/long via `if (!latitude || !longitude)`
  and does no range validation (`UserController.js:113`).
- [ ] **P3-4** Dead/empty middleware file `FUSE - BE/api/middleware/ValidateInput.js`
  (0 bytes) — remove or implement.
- [ ] **P3-5** Discovery soft-vs-strict filter semantics (`distanceFlex`/`ageFlex`) and
  age display — mostly addressed by the discovery upgrade (`preferredGender` now in
  allowed fields at `ProfileController.js:1680`; `discoveryPreferences` persisted on the
  model). **Verify** the remaining strict/soft decision from `CLAUDE.md` is settled.
- [ ] **P3-6** Add a health/readiness endpoint and structured logging for production
  monitoring (only `GET /` "Server running" exists today).

---

## Subsystem status snapshot

| Subsystem            | State | Notes |
|----------------------|-------|-------|
| Auth (OTP/JWT)       | ✅ Fixed (P0-1/P1-3/P1-6) | Age gate (P0-2) still open |
| Age / compliance     | ❌ Blocker | P0-2 no server 18+ enforcement |
| Video / calling      | ✅ Fixed (P1-1/P1-2) | socket auth + room/channel scoping added |
| Server hardening     | ⚠️ High | P1-4 no helmet/CORS/error handler; P1-5 rate limiting |
| Chat + safety authz  | ✅ Solid | block + participant checks consistent everywhere |
| Swipe / match writes | ✅ Solid | idempotent, race-safe, dual-write SwipeRecord |
| Account deletion     | ⚠️ Medium | P2-1 orphaned data + push to deleted users |
| Photo upload / privacy | ⚠️ Medium | P2-2 public URLs + EXIF; P2-3 mimetype trust |
| Likes ("Liked You")  | ⚠️ Medium | P2-4 blocked users not filtered |
| Dependencies         | ⚠️ Medium | P2-6 stray/deprecated packages |
| Secrets management   | ✅ OK | `.env` gitignored, no committed secrets |

---

## Suggested order of work

1. ~~**P0-1**~~ (fixed) — **P0-2** still non-negotiable before any real users.
2. ~~**P1-1 / P1-2** (video auth)~~ and ~~**P1-3** (log leaks)~~ — fixed.
3. **P1-4 / P1-5** (hardening + rate limits) remaining; ~~**P1-6** (pre-verify user)~~ fixed.
4. **P2** batch (deletion cascade, photo privacy, block filtering, deps).
5. **P3** hardening and verification pass.

## Residual notes from applied fixes

- **P1-2 / Twilio Chat:** channels created *before* this fix remain Twilio
  "public" type (Twilio does not support changing `type` after creation).
  Only newly created chat channels get the `private` protection. If this
  matters, it would need a one-off migration that recreates existing channels
  and re-adds members — not done here (out of scope for this pass).
- **P1-6:** the phone-number-enumeration angle (differing responses reveal
  whether a number has an account) is intentionally left open — see the
  fix note under P1-6 above for the reasoning.

## What I did NOT verify (be honest about coverage)

- End-to-end runtime testing — this is a static read, not an executed test pass.
- Twilio/Agora account-level config (webhook signature validation, geo permissions).
- The gifting and Explore/Event subsystems (explicitly out of scope here).
- Deep frontend state-machine correctness for onboarding resume across devices.
- Load/perf behaviour of the in-memory discovery deck cache under concurrency.
