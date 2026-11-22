import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const currencyValidator = v.string();

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
    favoriteCurrencies: v.optional(v.array(v.string())),
    includeCashBalance: v.optional(v.boolean()),
    onboardingGoals: v.optional(v.array(v.string())),
    referralSource: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    pushTokens: v.optional(v.array(v.string())),
    notificationsEnabled: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    lastDailyReminderDate: v.optional(v.string()),
    lastWeeklyReminderWeek: v.optional(v.string()),
  }).index("email", ["email"]),

  currencies: defineTable({
    code: v.string(),
    name: v.string(),
    symbol: v.string(),
    rate: v.number(),
    decimals: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

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

  budgets: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("custom"),
    ),
    recurring: v.boolean(),
    amountUsd: v.number(),
    currency: currencyValidator,
    originalAmount: v.number(),
    startDate: v.optional(v.string()), // YYYY-MM-DD local date
    endDate: v.optional(v.string()), // YYYY-MM-DD local date
    createdAt: v.string(), // ISO string
    updatedAt: v.string(), // ISO string
  }).index("by_user", ["userId"]),
});
