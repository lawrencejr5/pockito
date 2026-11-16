import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { currencyValidator } from "./schema";

export const migrateLocalData = mutation({
  args: {
    transactions: v.array(
      v.object({
        type: v.union(v.literal("expense"), v.literal("income")),
        title: v.string(),
        amountUsd: v.number(),
        currency: currencyValidator,
        originalAmount: v.number(),
        categoryId: v.string(),
        receiptStorageId: v.optional(v.id("_storage")),
        receiptUri: v.optional(v.string()),
        date: v.string(),
      }),
    ),
    wealthItems: v.array(
      v.object({
        kind: v.union(v.literal("asset"), v.literal("liability")),
        categoryId: v.string(),
        name: v.string(),
        amountUsd: v.number(),
        currency: currencyValidator,
        originalAmount: v.number(),
        note: v.optional(v.string()),
        updatedAt: v.string(),
      }),
    ),
    currency: v.optional(currencyValidator),
    includeCashBalance: v.optional(v.boolean()),
    fullname: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    for (const tx of args.transactions) {
      await ctx.db.insert("transactions", {
        userId,
        type: tx.type,
        title: tx.title,
        amountUsd: tx.amountUsd,
        currency: tx.currency,
        originalAmount: tx.originalAmount,
        categoryId: tx.categoryId,
        receiptStorageId: tx.receiptStorageId,
        receiptUri: tx.receiptUri,
        date: tx.date,
      });
    }

    for (const item of args.wealthItems) {
      await ctx.db.insert("wealthItems", {
        userId,
        kind: item.kind,
        categoryId: item.categoryId,
        name: item.name,
        amountUsd: item.amountUsd,
        currency: item.currency,
        originalAmount: item.originalAmount,
        note: item.note,
        updatedAt: item.updatedAt,
      });
    }

    const patch: {
      currency?: string;
      includeCashBalance?: boolean;
      fullname?: string;
      name?: string;
    } = {};

    if (args.currency !== undefined && user.currency === undefined) {
      patch.currency = args.currency;
    }
    if (
      args.includeCashBalance !== undefined &&
      user.includeCashBalance === undefined
    ) {
      patch.includeCashBalance = args.includeCashBalance;
    }
    if (args.fullname && !user.fullname) {
      patch.fullname = args.fullname;
      patch.name = args.fullname;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(userId, patch);
    }
  },
});
