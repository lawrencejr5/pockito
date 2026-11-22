import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

declare const process: { env: Record<string, string | undefined> };

const http = httpRouter();

auth.addHttpRoutes(http);

type RevenueCatWebhookPayload = {
  event?: {
    type?: string;
    app_user_id?: string;
    original_app_user_id?: string;
    product_id?: string;
    period_type?: string;
    expiration_at_ms?: number | null;
  };
};

http.route({
  path: "/revenuecat/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (expectedSecret) {
      const authHeader = request.headers.get("Authorization") ?? "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();
      if (token !== expectedSecret) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    let body: RevenueCatWebhookPayload;
    try {
      body = (await request.json()) as RevenueCatWebhookPayload;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const event = body.event;
    if (!event?.type) {
      return new Response("Missing event type", { status: 400 });
    }

    const candidateIds = [
      event.app_user_id,
      event.original_app_user_id,
    ].filter((id): id is string => typeof id === "string" && !id.startsWith("$RCAnonymousID:"));

    for (const appUserId of candidateIds) {
      await ctx.runMutation(internal.users.applyRevenueCatWebhook, {
        appUserId,
        eventType: event.type,
        productId: event.product_id,
        periodType: event.period_type,
        expirationAtMs:
          typeof event.expiration_at_ms === "number"
            ? event.expiration_at_ms
            : undefined,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

function renderLegalHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Pockito</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #10110f; color: #f5ece0; margin: 0; padding: 32px 20px; line-height: 1.65; }
    main { max-width: 720px; margin: 0 auto; background: #1a1c19; border: 1px solid #232421; border-radius: 20px; padding: 28px; }
    h1 { color: #e8d2b5; margin-top: 0; font-size: 26px; }
    h2 { color: #e8d2b5; margin-top: 24px; font-size: 17px; }
    p, li { color: #d0d2ca; font-size: 14px; }
    .meta { color: #a5a79b; font-size: 12px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <div class="meta">Pockito Personal Finance &amp; Wealth Tracker · Last updated November 2026</div>
    ${bodyHtml}
  </main>
</body>
</html>`;
}

http.route({
  path: "/legal/privacy",
  method: "GET",
  handler: httpAction(async () => {
    const html = renderLegalHtml(
      "Privacy Policy",
      `
      <p>Pockito respects your privacy. This Privacy Policy explains how Pockito collects, uses, and protects your information when you use our mobile application.</p>
      <h2>1. Information You Provide</h2>
      <p>When you sign in with Apple or Google, we store your account identifier, email address, and display name. Financial entries you create—such as transactions, receipt photos, budgets, assets, and liabilities—are stored securely in your private cloud account.</p>
      <h2>2. Subscriptions &amp; Payments</h2>
      <p>Subscriptions and lifetime purchases are processed directly by Apple App Store or Google Play and managed through RevenueCat. Pockito does not collect or store your payment card details.</p>
      <h2>3. Notifications &amp; Device Metadata</h2>
      <p>If you enable notifications, we store your Expo push token and timezone to send daily spending reminders, weekly wealth check-ins, and free-trial expiration reminders 2 days before your trial ends.</p>
      <h2>4. Data Deletion</h2>
      <p>You can permanently delete your account and all associated cloud data (transactions, receipts, budgets, and wealth items) at any time from Profile &rarr; Delete Account.</p>
      `,
    );
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

http.route({
  path: "/legal/terms",
  method: "GET",
  handler: httpAction(async () => {
    const html = renderLegalHtml(
      "Terms of Use",
      `
      <p>By downloading or using Pockito, you agree to these Terms of Use.</p>
      <h2>1. Pockito Pro Subscription &amp; Trial</h2>
      <ul>
        <li><strong>Monthly Plan ($1.99/month)</strong>: Includes a 7-day free trial for eligible new subscribers. Unless cancelled at least 24 hours before the end of the 7-day trial, your subscription automatically renews at $1.99 per month (or local store equivalent).</li>
        <li><strong>Lifetime Plan ($34.99 one-time)</strong>: Grants ongoing access to Pockito Pro features with a single one-time payment and no recurring charges.</li>
        <li>Payment is charged to your Apple ID account at confirmation of purchase (or at the end of the free trial).</li>
        <li>You can manage or cancel your subscription anytime in your Apple ID Account Settings or via Profile &rarr; Manage Subscription in the app.</li>
      </ul>
      <h2>2. Financial Disclaimer</h2>
      <p>Pockito is a personal budgeting, cashflow, and net-worth tracking tool. It does not provide financial, investment, tax, or legal advice.</p>
      <h2>3. Account Termination</h2>
      <p>Deleting your Pockito account removes your cloud data but does not automatically cancel an active App Store subscription. Please cancel your subscription in your Apple ID settings.</p>
      `,
    );
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

export default http;
