import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    includeCashBalance: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const patch: {
      fullname?: string;
      name?: string;
      currency?: "USD" | "NGN" | "GBP" | "EUR";
      includeCashBalance?: boolean;
    } = {};

    if (args.fullname !== undefined) {
      patch.fullname = args.fullname;
      patch.name = args.fullname;
    }
    if (args.currency !== undefined) {
      patch.currency = args.currency;
    }
    if (args.includeCashBalance !== undefined) {
      patch.includeCashBalance = args.includeCashBalance;
    }

    await ctx.db.patch(userId, patch);
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

    // 2. Delete wealth items
    const wealthItems = await ctx.db
      .query("wealthItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(wealthItems.map((item) => ctx.db.delete(item._id)));

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
