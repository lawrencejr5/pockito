import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { currencyValidator } from "./schema";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const check_apple_user = query({
  args: { apple_user_id: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "apple").eq("providerAccountId", args.apple_user_id),
      )
      .unique();

    if (account !== null) {
      return { exists: true };
    }

    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    if (users.length > 0) {
      return { exists: true };
    }

    return { exists: false };
  },
});

export const updatePreferences = mutation({
  args: {
    fullname: v.optional(v.string()),
    currency: v.optional(currencyValidator),
    favoriteCurrencies: v.optional(v.array(v.string())),
    includeCashBalance: v.optional(v.boolean()),
    onboardingGoals: v.optional(v.array(v.string())),
    referralSource: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const patch: {
      fullname?: string;
      name?: string;
      currency?: string;
      favoriteCurrencies?: string[];
      includeCashBalance?: boolean;
      onboardingGoals?: string[];
      referralSource?: string;
      onboardingCompleted?: boolean;
    } = {};

    if (args.fullname !== undefined) {
      patch.fullname = args.fullname;
      patch.name = args.fullname;
    }
    if (args.currency !== undefined) {
      patch.currency = args.currency;
    }
    if (args.favoriteCurrencies !== undefined) {
      patch.favoriteCurrencies = args.favoriteCurrencies;
    }
    if (args.includeCashBalance !== undefined) {
      patch.includeCashBalance = args.includeCashBalance;
    }
    if (args.onboardingGoals !== undefined) {
      patch.onboardingGoals = args.onboardingGoals;
    }
    if (args.referralSource !== undefined) {
      patch.referralSource = args.referralSource;
    }
    if (args.onboardingCompleted !== undefined) {
      patch.onboardingCompleted = args.onboardingCompleted;
    }

    await ctx.db.patch(userId, patch);
  },
});

export const updateAppLoadMetadata = mutation({
  args: {
    os: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    country: v.optional(v.string()),
    timezone: v.optional(v.string()),
    lastSeen: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;

    const patch: {
      os: "ios" | "android" | "web";
      country?: string;
      timezone?: string;
      lastSeen: number;
    } = {
      os: args.os,
      lastSeen: args.lastSeen,
    };

    if (args.country !== undefined) {
      patch.country = args.country;
    }
    if (args.timezone !== undefined) {
      patch.timezone = args.timezone;
    }

    await ctx.db.patch(userId, patch);
  },
});

export const storePushToken = mutation({
  args: {
    token: v.string(),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;

    const user = await ctx.db.get(userId);
    if (!user) return;

    const existingTokens = user.pushTokens ?? [];
    const nextTokens = existingTokens.includes(args.token)
      ? existingTokens
      : [...existingTokens, args.token];

    await ctx.db.patch(userId, {
      pushTokens: nextTokens,
      ...(args.timezone ? { timezone: args.timezone } : {}),
      ...(user.notificationsEnabled === undefined
        ? { notificationsEnabled: true }
        : {}),
    });
  },
});

export const setNotificationsEnabled = mutation({
  args: {
    enabled: v.boolean(),
    token: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) return;

    const patch: {
      notificationsEnabled: boolean;
      pushTokens?: string[];
      timezone?: string;
    } = {
      notificationsEnabled: args.enabled,
    };

    if (args.timezone) {
      patch.timezone = args.timezone;
    }

    if (args.enabled && args.token) {
      const current = user.pushTokens ?? [];
      if (!current.includes(args.token)) {
        patch.pushTokens = [...current, args.token];
      }
    }

    await ctx.db.patch(userId, patch);
  },
});

function getLocalDateKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export const getReminderCandidates = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const eligible = users.filter(
      (u) =>
        u.notificationsEnabled !== false &&
        u.pushTokens &&
        u.pushTokens.length > 0,
    );

    const now = new Date();
    const results = [];

    for (const user of eligible) {
      const tz = user.timezone || "UTC";
      const todayKey = getLocalDateKey(now, tz);

      const userTxs = await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const hasTransactionToday = userTxs.some((tx) => {
        const txDate = new Date(tx.date);
        return getLocalDateKey(txDate, tz) === todayKey;
      });

      results.push({
        userId: user._id,
        pushTokens: user.pushTokens ?? [],
        timezone: tz,
        lastDailyReminderDate: user.lastDailyReminderDate,
        lastWeeklyReminderWeek: user.lastWeeklyReminderWeek,
        hasTransactionToday,
      });
    }

    return results;
  },
});

export const markReminderSent = internalMutation({
  args: {
    userId: v.id("users"),
    lastDailyReminderDate: v.optional(v.string()),
    lastWeeklyReminderWeek: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      lastDailyReminderDate?: string;
      lastWeeklyReminderWeek?: string;
    } = {};
    if (args.lastDailyReminderDate !== undefined) {
      patch.lastDailyReminderDate = args.lastDailyReminderDate;
    }
    if (args.lastWeeklyReminderWeek !== undefined) {
      patch.lastWeeklyReminderWeek = args.lastWeeklyReminderWeek;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.userId, patch);
    }
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    // 1. Delete transactions and stored receipt blobs
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const tx of txs) {
      if (tx.receiptStorageId) {
        await ctx.storage.delete(tx.receiptStorageId).catch(() => {});
      }
      await ctx.db.delete(tx._id);
    }

    // 2. Delete wealth items & budgets
    const [wealthItems, budgets] = await Promise.all([
      ctx.db
        .query("wealthItems")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    await Promise.all([
      ...wealthItems.map((item) => ctx.db.delete(item._id)),
      ...budgets.map((budget) => ctx.db.delete(budget._id)),
    ]);

    // 3. Delete auth accounts & sessions
    const [authAccounts, authSessions] = await Promise.all([
      ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    await Promise.all([
      ...authAccounts.map((acc) => ctx.db.delete(acc._id)),
      ...authSessions.map((sess) => ctx.db.delete(sess._id)),
    ]);

    // 4. Delete the user record
    await ctx.db.delete(userId);
  },
});
