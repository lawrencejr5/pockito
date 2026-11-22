import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const TRIAL_REMINDER_STORAGE_KEY = "pockito.trialReminder";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

type StoredTrialReminder = {
  notificationId: string;
  trialEndMs: number;
};

async function readStoredReminder(): Promise<StoredTrialReminder | null> {
  try {
    const raw = await AsyncStorage.getItem(TRIAL_REMINDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTrialReminder>;
    if (
      typeof parsed.notificationId === "string" &&
      typeof parsed.trialEndMs === "number"
    ) {
      return {
        notificationId: parsed.notificationId,
        trialEndMs: parsed.trialEndMs,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function cancelLocalTrialReminder(): Promise<void> {
  const stored = await readStoredReminder();
  if (stored) {
    await Notifications.cancelScheduledNotificationAsync(
      stored.notificationId,
    ).catch(() => {});
    await AsyncStorage.removeItem(TRIAL_REMINDER_STORAGE_KEY).catch(() => {});
  }
}

/**
 * Schedules a local reminder 2 days before the 7-day free trial ends.
 * Safe to call repeatedly; deduplicates by `trialEndMs`.
 */
export async function syncLocalTrialReminder(params: {
  isTrial: boolean;
  expirationDate: string | null;
}): Promise<void> {
  if (Platform.OS === "web") return;

  if (!params.isTrial || !params.expirationDate) {
    await cancelLocalTrialReminder();
    return;
  }

  const trialEndMs = new Date(params.expirationDate).getTime();
  if (!Number.isFinite(trialEndMs)) return;

  const stored = await readStoredReminder();
  if (stored && stored.trialEndMs === trialEndMs) {
    return;
  }

  if (stored) {
    await Notifications.cancelScheduledNotificationAsync(
      stored.notificationId,
    ).catch(() => {});
  }

  const reminderMs = trialEndMs - TWO_DAYS_MS;
  if (reminderMs <= Date.now()) {
    await AsyncStorage.removeItem(TRIAL_REMINDER_STORAGE_KEY).catch(() => {});
    return;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your Pockito trial ends in 2 days",
        body: "Your 7-day free trial ends in 2 days ($1.99/mo after). Manage or cancel anytime in Profile.",
        sound: "pockito.wav",
        data: { type: "trial-reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminderMs),
        ...(Platform.OS === "android"
          ? { channelId: "pockito-reminders" }
          : {}),
      },
    });

    await AsyncStorage.setItem(
      TRIAL_REMINDER_STORAGE_KEY,
      JSON.stringify({ notificationId, trialEndMs }),
    );
  } catch (error) {
    console.warn("Failed to schedule trial reminder notification:", error);
  }
}
