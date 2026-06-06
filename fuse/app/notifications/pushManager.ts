import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { authClient } from "../auth/authClient";
import { authStore } from "../auth/authStore";
import { navigationRef } from "../navigation/navigationRef";
import { getStableDeviceId } from "./deviceIdentity";
import { notificationApi } from "./notificationApi";
import { resolveNotificationRoute } from "./notificationNavigation";
import { NotificationPayloadData } from "./types";

const PUSH_TOKEN_KEY = "pushToken:lastRegistered";
const PUSH_PROVIDER_KEY = "pushProvider:lastRegistered";
const AUTH_BLOCKED_ROUTES = new Set([
  "AuthGate",
  "Login",
  "PhoneVerif",
  "CodeVerif",
  "Intro",
  "ProfileSetup",
  "LocationSetup",
  "OnboardingOptional",
  "ProfileDetails",
  "PromptSelection",
  "PhotoUpload",
  "Guidelines",
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushManager {
  private started = false;
  private responseListener: Notifications.EventSubscription | null = null;
  private receivedListener: Notifications.EventSubscription | null = null;
  private authUnsubscribe: (() => void) | null = null;
  private pendingRoute: { name: string; params?: Record<string, any> } | null =
    null;
  private lastNotificationIdentifier: string | null = null;

  start() {
    if (this.started) return;
    this.started = true;
    console.log("[notifications] push manager start");

    this.receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "[notifications] foreground notification received",
          notification.request.identifier
        );
      }
    );

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.queueNavigationFromNotification(
          response.notification.request.content.data as NotificationPayloadData,
          response.notification.request.identifier
        );
      });

    this.authUnsubscribe = authStore.subscribe(() => {
      void this.syncTokenWithBackend();
    });

    void this.syncTokenWithBackend();
    void this.captureInitialNotificationResponse();
  }

  stop() {
    this.responseListener?.remove();
    this.receivedListener?.remove();
    this.authUnsubscribe?.();
    this.responseListener = null;
    this.receivedListener = null;
    this.authUnsubscribe = null;
    this.started = false;
  }

  async unregisterCurrentDevice() {
    try {
      const [pushToken, provider, deviceId] = await Promise.all([
        AsyncStorage.getItem(PUSH_TOKEN_KEY),
        AsyncStorage.getItem(PUSH_PROVIDER_KEY),
        getStableDeviceId(),
      ]);

      if (!pushToken && !deviceId) return;

      await notificationApi.unregisterToken({
        pushToken,
        deviceId,
        provider: provider || "EXPO",
      });
    } catch (error) {
      console.warn("[notifications] unregister failed", error);
    } finally {
      await Promise.all([
        AsyncStorage.removeItem(PUSH_TOKEN_KEY),
        AsyncStorage.removeItem(PUSH_PROVIDER_KEY),
      ]);
    }
  }

  onNavigationStateChange(routeName?: string | null) {
    if (routeName && !AUTH_BLOCKED_ROUTES.has(routeName)) {
      this.flushPendingNavigation();
    }
  }

  private async captureInitialNotificationResponse() {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) {
      console.log("[notifications] no initial notification response");
      return;
    }

    console.log(
      "[notifications] initial notification response found",
      response.notification.request.identifier
    );

    this.queueNavigationFromNotification(
      response.notification.request.content.data as NotificationPayloadData,
      response.notification.request.identifier
    );
  }

  private queueNavigationFromNotification(
    data: NotificationPayloadData | null | undefined,
    identifier?: string | null
  ) {
    if (identifier && this.lastNotificationIdentifier === identifier) {
      console.log(
        "[notifications] duplicate notification response ignored",
        identifier
      );
      return;
    }

    const route = resolveNotificationRoute(data);
    if (!route) {
      console.log(
        "[notifications] no route resolved for notification",
        data?.type || null
      );
      return;
    }

    console.log("[notifications] queued navigation from notification", {
      identifier: identifier || null,
      type: data?.type || null,
      routeName: route.name,
      params: route.params || null,
    });

    this.lastNotificationIdentifier = identifier || null;
    this.pendingRoute = route;
    this.flushPendingNavigation();
  }

  flushPendingNavigation() {
    if (!this.pendingRoute) return;
    if (!navigationRef.isReady()) {
      console.log(
        "[notifications] navigation not ready yet for pending notification"
      );
      return;
    }

    console.log("[notifications] navigating from notification", this.pendingRoute);
    (navigationRef as any).navigate(
      this.pendingRoute.name,
      this.pendingRoute.params
    );
    this.pendingRoute = null;
  }

  private async getPushToken() {
    if (!Device.isDevice) {
      console.log("[notifications] physical device required for push registration");
      return null;
    }

    try {
      const existingPermissions = await Notifications.getPermissionsAsync();
      console.log("[notifications] existing permission state", existingPermissions);

      let granted =
        (existingPermissions as any).granted ??
        (existingPermissions as any).status === "granted";

      if (!granted) {
        const permissionResponse = await Notifications.requestPermissionsAsync();
        console.log(
          "[notifications] permission request response",
          permissionResponse
        );
        granted =
          (permissionResponse as any).granted ??
          (permissionResponse as any).status === "granted";
      }

      if (!granted) {
        console.log("[notifications] permission denied");
        return null;
      }

      if (Platform.OS === "android") {
        console.log("[notifications] setting android notification channel...");
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#ff5864",
        });
        console.log("[notifications] android notification channel ready");
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

      console.log("[notifications] resolving expo push token ...", {
        projectId: projectId || null,
        platform: Platform.OS,
        appOwnership: Constants.appOwnership || "standalone",
        isDevice: Device.isDevice,
      });

      if (!projectId) {
        console.log("[notifications] missing EAS projectId, cannot fetch token");
        return null;
      }

      const startedAt = Date.now();

      const tokenPromise = Notifications.getExpoPushTokenAsync({ projectId });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("TOKEN_FETCH_TIMEOUT_20000MS")),
          20000
        )
      );

      const tokenResponse = await Promise.race([tokenPromise, timeoutPromise]);

      console.log("[notifications] expo push token acquired", {
        durationMs: Date.now() - startedAt,
        tokenPreview: `${tokenResponse.data.slice(0, 20)}...`,
      });

      return tokenResponse.data;
    } catch (error: any) {
      console.log("[notifications] expo push token fetch failed");
      console.log("[notifications] error name", error?.name || null);
      console.log("[notifications] error message", error?.message || null);
      console.log("[notifications] error stack", error?.stack || null);

      try {
        console.log(
          "[notifications] error json",
          JSON.stringify(error, null, 2)
        );
      } catch {
        console.log("[notifications] error json could not be stringified");
      }

      return null;
    }
  }

  async syncTokenWithBackend(force = false) {
    try {
      const accessToken = await authClient.getValidAccessToken();
      console.log("[notifications] valid auth token found for push sync", !!accessToken);
    } catch {
      console.log("[notifications] push sync skipped: no valid auth token");
      return;
    }

    const pushToken = await this.getPushToken();
    if (!pushToken) {
      console.log("[notifications] push sync skipped: no push token");
      return;
    }

    const [deviceId, lastRegisteredToken, provider] = await Promise.all([
      getStableDeviceId(),
      AsyncStorage.getItem(PUSH_TOKEN_KEY),
      AsyncStorage.getItem(PUSH_PROVIDER_KEY),
    ]);

    if (!force && lastRegisteredToken === pushToken && provider === "EXPO") {
      console.log(
        "[notifications] push token unchanged, skipping backend registration",
        {
          deviceId,
          provider,
        }
      );
      return;
    }

    console.log("[notifications] registering push token with backend", {
      deviceId,
      platform: Platform.OS,
      provider: "EXPO",
      pushTokenPreview: `${pushToken.slice(0, 12)}...`,
    });

    await notificationApi.registerToken({
      pushToken,
      platform: Platform.OS,
      deviceId,
      provider: "EXPO",
      metadata: {
        appOwnership: Constants.appOwnership || "standalone",
      },
    });

    console.log("[notifications] backend token registration succeeded", {
      deviceId,
      provider: "EXPO",
    });

    await Promise.all([
      AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken),
      AsyncStorage.setItem(PUSH_PROVIDER_KEY, "EXPO"),
    ]);
  }
}

export const pushManager = new PushManager();