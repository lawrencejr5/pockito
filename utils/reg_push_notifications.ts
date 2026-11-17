import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function getDeviceTimeZone(): string {
  try {
    const calTz = Localization.getCalendars?.()[0]?.timeZone;
    if (calTz) return calTz;
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pockito-reminders", {
      name: "Pockito Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#e8d2b5",
      sound: "pockito",
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn("Expo EAS projectId not found for push notifications");
    return null;
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    return pushTokenString;
  } catch (err) {
    console.warn("Failed to get Expo push token:", err);
    return null;
  }
}
