import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const DAILY_NUDGE_MESSAGES = [
  "Did you spend or earn anything today? Log it in 10 seconds to keep your balance accurate.",
  "Quick check-in: record today’s transactions before you wind down.",
  "Every naira and dollar counts — tap to log today’s spending in Pockito.",
  "Keep your cashflow streak alive! Add today’s income or expenses.",
  "End the day knowing exactly where your money went. Log today’s entries!",
];

const WEEKLY_WEALTH_MESSAGES = [
  "Sunday check-in: take a minute to review your Report and update your Wealth balance sheet.",
  "How did your net worth move this week? Check your Weekly Report & Wealth tab.",
  "Weekly wealth ritual: review your spending insights and keep your assets up to date.",
];

function pickRandom(list: string[]): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return list[buf[0] % list.length];
}

function getLocalClock(now: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(now);

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hourRaw = parseInt(get("hour"), 10);
    const hour = hourRaw === 24 ? 0 : hourRaw;
    const weekday = get("weekday");
    const dateKey = `${year}-${month}-${day}`;

    // Week identifier (Sunday-anchored week key using local date)
    const localMid = new Date(`${dateKey}T12:00:00Z`);
    const jan1 = new Date(`${year}-01-01T12:00:00Z`);
    const dayOfYear = Math.floor(
      (localMid.getTime() - jan1.getTime()) / 86_400_000,
    );
    const weekNum = Math.ceil((dayOfYear + jan1.getUTCDay() + 1) / 7);
    const weekKey = `${year}-W${String(weekNum).padStart(2, "0")}`;

    return { hour, weekday, dateKey, weekKey };
  } catch {
    const iso = now.toISOString();
    return {
      hour: now.getUTCHours(),
      weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        now.getUTCDay()
      ],
      dateKey: iso.slice(0, 10),
      weekKey: `${iso.slice(0, 4)}-W00`,
    };
  }
}

async function sendPushBatch(
  messages: Array<{
    to: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }>,
) {
  if (messages.length === 0) return;

  const payloads = messages.map((m) => ({
    to: m.to,
    sound: "pockito.wav",
    title: m.title,
    body: m.body,
    data: m.data,
    channelId: "pockito-reminders",
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE);
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
    } catch (error) {
      console.error("Error sending Expo push batch:", error);
    }
  }
}

export const checkAndSendReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.runQuery(
      internal.users.getReminderCandidates,
      {},
    );
    if (candidates.length === 0) return;

    const now = new Date();
    const toSend: Array<{
      to: string;
      title: string;
      body: string;
      data: Record<string, string>;
    }> = [];

    for (const user of candidates) {
      const clock = getLocalClock(now, user.timezone);

      // 1. Smart Daily Evening Nudge at 8:00 PM local time (only if no transaction logged today)
      if (
        clock.hour === 20 &&
        !user.hasTransactionToday &&
        user.lastDailyReminderDate !== clock.dateKey
      ) {
        const body = pickRandom(DAILY_NUDGE_MESSAGES);
        for (const token of user.pushTokens) {
          toSend.push({
            to: token,
            title: "Log today’s spending 💰",
            body,
            data: { type: "daily-nudge" },
          });
        }
        await ctx.runMutation(internal.users.markReminderSent, {
          userId: user.userId,
          lastDailyReminderDate: clock.dateKey,
        });
      }

      // 2. Weekly Wealth Check-in on Sunday at 6:00 PM local time
      if (
        clock.weekday === "Sun" &&
        clock.hour === 18 &&
        user.lastWeeklyReminderWeek !== clock.weekKey
      ) {
        const body = pickRandom(WEEKLY_WEALTH_MESSAGES);
        for (const token of user.pushTokens) {
          toSend.push({
            to: token,
            title: "Weekly Wealth Check-in 📊",
            body,
            data: { type: "weekly-wealth" },
          });
        }
        await ctx.runMutation(internal.users.markReminderSent, {
          userId: user.userId,
          lastWeeklyReminderWeek: clock.weekKey,
        });
      }
    }

    await sendPushBatch(toSend);
  },
});
