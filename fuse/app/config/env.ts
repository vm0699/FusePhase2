export const API_BASE_URL = "https://api.fusedating.co.in";
//export const API_BASE_URL = "http://localhost:5000";

// ─── Fuse Explore launch gate ────────────────────────────────────────────────
// Explore (dates, events, premium, event-circle) ships fully browseable, but the
// committing actions — Book a table, Get tickets, RSVP, Request premium — are the
// parts whose fulfilment/payment loop isn't production-ready yet. While this is
// false, those CTAs show a friendly "Coming soon" popup instead of proceeding.
// Flip to true (and set EXPLORE_COMMERCE_LIVE=true on the backend) to go live.
export const EXPLORE_COMMERCE_LIVE = false;