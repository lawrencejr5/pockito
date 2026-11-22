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

function normalizeCategoryIds(categoryIds?: string[]): string[] | undefined {
  if (!categoryIds || categoryIds.length === 0) return undefined;
  const unique = Array.from(new Set(categoryIds.filter(Boolean))).sort();
  return unique.length > 0 ? unique : undefined;
}

function sameCategorySet(a?: string[], b?: string[]): boolean {
  const normA = normalizeCategoryIds(a) ?? [];
  const normB = normalizeCategoryIds(b) ?? [];
  if (normA.length !== normB.length) return false;
  return normA.every((val, idx) => val === normB[idx]);
}

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
        categoryIds: item.categoryIds,
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
    categoryIds: v.optional(v.array(v.string())),
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
    const categoryIds = normalizeCategoryIds(args.categoryIds);

    // Enforce at most one recurring budget per (cadence, categorySet).
    if (isRecurring) {
      const existingRows = await ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const existingRecurring = existingRows.find(
        (b) =>
          b.recurring &&
          b.period === args.period &&
          sameCategorySet(b.categoryIds, categoryIds),
      );
      if (existingRecurring) {
        await ctx.db.patch(existingRecurring._id, {
          name: args.name,
          categoryIds,
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
      categoryIds,
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
    categoryIds: v.optional(v.array(v.string())),
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
    const categoryIds = normalizeCategoryIds(args.categoryIds);

    // If changing to a (cadence, categorySet) that already exists on another doc, replace that duplicate.
    if (isRecurring) {
      const existingRows = await ctx.db
        .query("budgets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const row of existingRows) {
        if (
          row._id !== args.id &&
          row.recurring &&
          row.period === args.period &&
          sameCategorySet(row.categoryIds, categoryIds)
        ) {
          await ctx.db.delete(row._id);
        }
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      categoryIds,
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
