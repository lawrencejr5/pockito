import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currencyValidator } from "./schema";

const budgetPeriodValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("custom"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const rows = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return rows
      .map((item) => ({
        id: item._id as string,
        name: item.name,
        period: item.period,
        recurring: item.recurring,
        amountUsd: item.amountUsd,
        currency: item.currency,
        originalAmount: item.originalAmount,
        startDate: item.startDate,
        endDate: item.endDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  },
});

export const add = mutation({
  args: {
    name: v.optional(v.string()),
    period: budgetPeriodValidator,
    recurring: v.boolean(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const nowIso = new Date().toISOString();
    const isRecurring = args.period === "custom" ? false : args.recurring;

    // Enforce at most one recurring budget per cadence (daily / weekly / monthly).
    if (isRecurring) {
      const existingRows = await ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const existingRecurring = existingRows.find(
        (b) => b.recurring && b.period === args.period,
      );
      if (existingRecurring) {
        await ctx.db.patch(existingRecurring._id, {
          name: args.name,
          amountUsd: args.amountUsd,
          currency: args.currency,
          originalAmount: args.originalAmount,
          startDate: undefined,
          endDate: undefined,
          updatedAt: nowIso,
        });
        return existingRecurring._id;
      }
    }

    return await ctx.db.insert("budgets", {
      userId,
      name: args.name,
      period: args.period,
      recurring: isRecurring,
      amountUsd: args.amountUsd,
      currency: args.currency,
      originalAmount: args.originalAmount,
      startDate: isRecurring ? undefined : args.startDate,
      endDate: isRecurring ? undefined : args.endDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("budgets"),
    name: v.optional(v.string()),
    period: budgetPeriodValidator,
    recurring: v.boolean(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Budget not found");
    }

    const isRecurring = args.period === "custom" ? false : args.recurring;

    // If changing to a recurring cadence that already exists on another doc, replace that duplicate.
    if (isRecurring) {
      const existingRows = await ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const row of existingRows) {
        if (row._id !== args.id && row.recurring && row.period === args.period) {
          await ctx.db.delete(row._id);
        }
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      period: args.period,
      recurring: isRecurring,
      amountUsd: args.amountUsd,
      currency: args.currency,
      originalAmount: args.originalAmount,
      startDate: isRecurring ? undefined : args.startDate,
      endDate: isRecurring ? undefined : args.endDate,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Budget not found");
    }

    await ctx.db.delete(args.id);
  },
});
