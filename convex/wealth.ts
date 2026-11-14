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
      .query("wealthItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return rows
      .map((item) => ({
        id: item._id as string,
        kind: item.kind,
        categoryId: item.categoryId,
        name: item.name,
        amountUsd: item.amountUsd,
        currency: item.currency,
        originalAmount: item.originalAmount,
        note: item.note,
        updatedAt: item.updatedAt,
      }))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  },
});

export const add = mutation({
  args: {
    kind: v.union(v.literal("asset"), v.literal("liability")),
    categoryId: v.string(),
    name: v.string(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    note: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    return await ctx.db.insert("wealthItems", {
      userId,
      kind: args.kind,
      categoryId: args.categoryId,
      name: args.name,
      amountUsd: args.amountUsd,
      currency: args.currency,
      originalAmount: args.originalAmount,
      note: args.note,
      updatedAt: args.updatedAt ?? new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("wealthItems"),
    kind: v.union(v.literal("asset"), v.literal("liability")),
    categoryId: v.string(),
    name: v.string(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Wealth item not found");
    }

    await ctx.db.patch(args.id, {
      kind: args.kind,
      categoryId: args.categoryId,
      name: args.name,
      amountUsd: args.amountUsd,
      currency: args.currency,
      originalAmount: args.originalAmount,
      note: args.note,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("wealthItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Wealth item not found");
    }

    await ctx.db.delete(args.id);
  },
});
