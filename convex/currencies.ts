import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation, query } from "./_generated/server";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "HUF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "NGN",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const SYMBOL_OVERRIDES: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  CAD: "CA$",
  AUD: "A$",
  INR: "₹",
  ZAR: "R",
  GHS: "₵",
  KES: "KSh",
  KRW: "₩",
  CHF: "CHF",
  BRL: "R$",
  MXN: "MX$",
  TRY: "₺",
  AED: "د.إ",
  SAR: "﷼",
  PHP: "₱",
  THB: "฿",
  ILS: "₪",
  PLN: "zł",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  RUB: "₽",
  UAH: "₴",
};

function getCurrencyMeta(code: string): { name: string; symbol: string; decimals: number } {
  let name = code;
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
    name = displayNames.of(code) ?? code;
  } catch {
    name = code;
  }

  let symbol = SYMBOL_OVERRIDES[code];
  if (!symbol) {
    try {
      const parts = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
      }).formatToParts(0);
      symbol = parts.find((p) => p.type === "currency")?.value ?? code;
    } catch {
      symbol = code;
    }
  }

  const decimals = ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
  return { name, symbol, decimals };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("currencies").collect();
    return rows.sort((a, b) => a.code.localeCompare(b.code));
  },
});

export const upsertRates = internalMutation({
  args: {
    entries: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        symbol: v.string(),
        rate: v.number(),
        decimals: v.number(),
      }),
    ),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    for (const entry of args.entries) {
      const existing = await ctx.db
        .query("currencies")
        .withIndex("by_code", (q) => q.eq("code", entry.code))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: entry.name,
          symbol: entry.symbol,
          rate: entry.rate,
          decimals: entry.decimals,
          updatedAt: args.updatedAt,
        });
      } else {
        await ctx.db.insert("currencies", {
          code: entry.code,
          name: entry.name,
          symbol: entry.symbol,
          rate: entry.rate,
          decimals: entry.decimals,
          updatedAt: args.updatedAt,
        });
      }
    }
  },
});

async function fetchAndStoreRates(ctx: { runMutation: any }) {
  const response = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!response.ok) {
    throw new Error(`Exchange rate API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: string;
    rates?: Record<string, number>;
  };

  if (data.result !== "success" || !data.rates) {
    throw new Error("Invalid response from exchange rate API");
  }

  const now = Date.now();
  const entries = Object.entries(data.rates)
    .filter(([code, rate]) => /^[A-Z]{3}$/.test(code) && typeof rate === "number" && rate > 0)
    .map(([code, rate]) => {
      const meta = getCurrencyMeta(code);
      return {
        code,
        name: meta.name,
        symbol: meta.symbol,
        rate,
        decimals: meta.decimals,
      };
    });

  await ctx.runMutation(internal.currencies.upsertRates, {
    entries,
    updatedAt: now,
  });

  return { count: entries.length, updatedAt: now };
}

export const syncRates = internalAction({
  args: {},
  handler: async (ctx) => {
    return await fetchAndStoreRates(ctx);
  },
});

export const ensureSeeded = action({
  args: {},
  handler: async (ctx) => {
    return await fetchAndStoreRates(ctx);
  },
});

