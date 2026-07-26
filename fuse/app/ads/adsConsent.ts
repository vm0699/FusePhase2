import { AdsConsent, AdsConsentStatus, MobileAds } from "react-native-google-mobile-ads";

// Google's UMP (User Messaging Platform) consent gate. Ads must not be
// requested — personalized or not — until this has resolved: EEA/UK/Brazil
// users legally require a consent decision first, and Play Console's Ads
// policy expects the same gathering step regardless of where the app is
// distributed. `MobileAds().initialize()` is deliberately called only after
// consent resolves, per Google's documented integration order.
export type AdsGateState = {
  canRequestAds: boolean;
  nonPersonalizedOnly: boolean;
};

let cached: Promise<AdsGateState> | null = null;

async function resolveAdsGateState(): Promise<AdsGateState> {
  try {
    const consentInfo = await AdsConsent.gatherConsent();

    if (!consentInfo.canRequestAds) {
      return { canRequestAds: false, nonPersonalizedOnly: true };
    }

    // Outside regulated regions (status NOT_REQUIRED — the case for our
    // primary India market today), personalized ads need no extra consent,
    // matching prior behavior. Inside regulated regions, honor the user's
    // actual choice from the consent form.
    let nonPersonalizedOnly = false;
    if (consentInfo.status === AdsConsentStatus.OBTAINED) {
      try {
        const choices = await AdsConsent.getUserChoices();
        nonPersonalizedOnly = !choices.selectPersonalisedAds;
      } catch (error) {
        console.warn(
          "[ads] failed to read consent choices, defaulting to non-personalized",
          error
        );
        nonPersonalizedOnly = true;
      }
    }

    await MobileAds().initialize();

    return { canRequestAds: true, nonPersonalizedOnly };
  } catch (error) {
    console.warn("[ads] consent gathering failed, ads disabled for this session", error);
    return { canRequestAds: false, nonPersonalizedOnly: true };
  }
}

// Resolves once per app session — first caller triggers the UMP flow
// (and possible consent dialog), later callers reuse the same result.
export function ensureAdsConsent(): Promise<AdsGateState> {
  if (!cached) {
    cached = resolveAdsGateState();
  }
  return cached;
}
