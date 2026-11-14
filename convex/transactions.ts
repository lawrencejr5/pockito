import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currencyValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const mapped = await Promise.all(
      rows.map(async (tx) => {
        const signedUrl = tx.receiptStorageId
          ? await ctx.storage.getUrl(tx.receiptStorageId)
          : null;
        return {
          id: tx._id as string,
          type: tx.type,
          title: tx.title,
          amountUsd: tx.amountUsd,
          currency: tx.currency,
          originalAmount: tx.originalAmount,
          categoryId: tx.categoryId,
          receiptUri: signedUrl ?? tx.receiptUri ?? undefined,
          date: tx.date,
        };
      }),
    );

    return mapped.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const add = mutation({
  args: {
    type: v.union(v.literal("expense"), v.literal("income")),
    title: v.string(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    categoryId: v.string(),
    receiptStorageId: v.optional(v.id("_storage")),
    receiptUri: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    return await ctx.db.insert("transactions", {
      userId,
      type: args.type,
      title: args.title,
      amountUsd: args.amountUsd,
      currency: args.currency,
      originalAmount: args.originalAmount,
      categoryId: args.categoryId,
      receiptStorageId: args.receiptStorageId,
      receiptUri: args.receiptUri,
      date: args.date,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    type: v.union(v.literal("expense"), v.literal("income")),
    title: v.string(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    categoryId: v.string(),
    receiptStorageId: v.optional(v.id("_storage")),
    clearReceipt: v.optional(v.boolean()),
    receiptUri: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Transaction not found");
    }

    let nextStorageId = existing.receiptStorageId;
    let nextUri = existing.receiptUri;

    if (args.clearReceipt) {
      if (existing.receiptStorageId) {
        await ctx.storage.delete(existing.receiptStorageId).catch(() => {});
      }
      nextStorageId = undefined;
      nextUri = undefined;
    } else if (args.receiptStorageId) {
      if (
        existing.receiptStorageId &&
        existing.receiptStorageId !== args.receiptStorageId
      ) {
        await ctx.storage.delete(existing.receiptStorageId).catch(() => {});
      }
      nextStorageId = args.receiptStorageId;
      nextUri = undefined;
    } else if (args.receiptUri !== undefined) {
      nextUri = args.receiptUri;
    }

    await ctx.db.patch(args.id, {
      type: args.type,
      title: args.title,
      amountUsd: args.amountUsd,
      currency: args.currency,
      originalAmount: args.originalAmount,
      categoryId: args.categoryId,
      receiptStorageId: nextStorageId,
      receiptUri: nextUri,
      date: args.date,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Transaction not found");
    }

    if (existing.receiptStorageId) {
      await ctx.storage.delete(existing.receiptStorageId).catch(() => {});
    }
    await ctx.db.delete(args.id);
  },
});
