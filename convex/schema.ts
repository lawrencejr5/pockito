import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const currencyValidator = v.union(
  v.literal("USD"),
  v.literal("NGN"),
  v.literal("GBP"),
  v.literal("EUR"),
);

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    fullname: v.optional(v.string()),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    currency: v.optional(currencyValidator),
    includeCashBalance: v.optional(v.boolean()),
  }).index("email", ["email"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("expense"), v.literal("income")),
    title: v.string(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    categoryId: v.string(),
    receiptStorageId: v.optional(v.id("_storage")),
    receiptUri: v.optional(v.string()),
    date: v.string(), // ISO string
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  wealthItems: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("asset"), v.literal("liability")),
    categoryId: v.string(),
    name: v.string(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    note: v.optional(v.string()),
    updatedAt: v.string(), // ISO string
  }).index("by_user", ["userId"]),
});
