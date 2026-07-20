import React, { useCallback, useState } from "react";
import { FusePopup } from "../../FusePopup";
import { EXPLORE_COMMERCE_LIVE } from "../../../app/config/env";

/**
 * Gate for Fuse Explore's committing actions (Book a table, Get tickets, RSVP,
 * Request premium) while their fulfilment/payment loop isn't production-ready.
 *
 * Usage:
 *   const comingSoon = useExploreComingSoon();
 *   // in a CTA handler:
 *   if (comingSoon.gate()) return;   // shows popup + stops when not live
 *   navigation.navigate("BookingCheckout", ...);
 *   // render once in the screen:
 *   {comingSoon.modal}
 *
 * Flip EXPLORE_COMMERCE_LIVE (app/config/env.ts) + EXPLORE_COMMERCE_LIVE=true on
 * the backend to let every gated action through untouched.
 */
export function useExploreComingSoon(message?: string) {
  const [visible, setVisible] = useState(false);

  // Returns true when the action was intercepted (caller should stop).
  const gate = useCallback((): boolean => {
    if (EXPLORE_COMMERCE_LIVE) return false;
    setVisible(true);
    return true;
  }, []);

  const modal = (
    <FusePopup
      visible={visible}
      title="Coming soon 🎉"
      message={
        message ||
        "We're putting the finishing touches on this for Chennai. It'll be ready very soon — thanks for your patience!"
      }
      tone="info"
      onClose={() => setVisible(false)}
      primaryAction={{ label: "Got it", onPress: () => setVisible(false) }}
    />
  );

  return { gate, modal, isLive: EXPLORE_COMMERCE_LIVE };
}
