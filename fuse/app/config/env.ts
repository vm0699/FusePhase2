const LOCAL_API_URL = "http://localhost:5000";
const PRODUCTION_API_URL = "https://api.fusedating.co.in";

// __DEV__ is set by Metro/Expo: true for `expo start` / dev builds, false for
// release/EAS builds. This removes the need to hand-toggle the URL before
// shipping — a release build can never accidentally point at localhost.
export const API_BASE_URL = __DEV__ ? LOCAL_API_URL : PRODUCTION_API_URL;

// ─── Fuse Explore launch gate ────────────────────────────────────────────────
// Explore (dates, events, premium, event-circle) ships fully browseable, but the
// committing actions — Book a table, Get tickets, RSVP, Request premium — are the
// parts whose fulfilment/payment loop isn't production-ready yet. While this is
// false, those CTAs show a friendly "Coming soon" popup instead of proceeding.
// Flip to true (and set EXPLORE_COMMERCE_LIVE=true on the backend) to go live.
export const EXPLORE_COMMERCE_LIVE = false;