import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

const DEVICE_ID_KEY = "pushDeviceId";

function buildFallbackDeviceId() {
  return `fuse-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getStableDeviceId() {
  const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (storedId) return storedId;

  let derivedId =
    Application.getAndroidId() ||
    (await Application.getIosIdForVendorAsync().catch(() => null)) ||
    "";

  if (!derivedId) {
    derivedId = buildFallbackDeviceId();
  }

  await AsyncStorage.setItem(DEVICE_ID_KEY, derivedId);
  return derivedId;
}
