import Google from "@auth/core/providers/google";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  convexAuth,
  createAccount,
  retrieveAccount,
} from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

const decodeBase64 = (str: string): string => {
  if (typeof atob === "function") {
    return atob(str);
  }
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let buffer = "";
  const cleanStr = str.replace(/=+$/, "").replace(/[^A-Za-z0-9+/]/g, "");
  let bc = 0;
  let bs = 0;
  for (let idx = 0; idx < cleanStr.length; idx++) {
    const char = cleanStr.charAt(idx);
    const p = chars.indexOf(char);
    if (p === -1) continue;
    bs = bc % 4 ? bs * 64 + p : p;
    if (bc++ % 4) {
      buffer += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return buffer;
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      profile(googleProfile) {
        const fullname =
          googleProfile.name ||
          googleProfile.email?.split("@")[0] ||
          "Pockito User";
        const username =
          googleProfile.given_name ||
          googleProfile.name?.split(" ")[0] ||
          googleProfile.email?.split("@")[0];
        const email = googleProfile.email?.trim().toLowerCase();
        return {
          id: googleProfile.sub,
          email,
          emailVerified: googleProfile.email_verified ?? true,
          fullname,
          username,
          name: fullname,
        };
      },
    }),
    ConvexCredentials({
      id: "apple",
      authorize: async (credentials, ctx) => {
        const identityToken = credentials.identityToken as string;
        if (!identityToken) {
          throw new Error("Missing Apple identity token");
        }

        let payload: {
          iss?: string;
          aud?: string;
          sub?: string;
          email?: string;
        };
        try {
          const parts = identityToken.split(".");
          if (parts.length !== 3) {
            throw new Error("Invalid ID token format");
          }
          const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const paddedBase64 = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "=",
          );
          payload = JSON.parse(decodeBase64(paddedBase64));
        } catch (error) {
          console.error("Error decoding Apple token", error);
          throw new Error("Failed to decode Apple identity token");
        }

        if (payload.iss !== "https://appleid.apple.com") {
          throw new Error("Invalid Apple token issuer");
        }
        if (
          payload.aud !== "com.lawrencejr.pockito" &&
          payload.aud !== "host.exp.Exponent"
        ) {
          throw new Error("Invalid Apple token audience");
        }
        if (!payload.sub) {
          throw new Error("Apple token missing subject claim");
        }

        const appleUserId = payload.sub;

        let retrieved = null;
        try {
          retrieved = await retrieveAccount(ctx, {
            provider: "apple",
            account: { id: appleUserId },
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          if (message !== "InvalidAccountId") {
            throw error;
          }
        }

        if (retrieved !== null) {
          return { userId: retrieved.user._id };
        }

        const rawEmail = payload.email || (credentials.email as string);
        if (!rawEmail) {
          throw new Error("Email address is required for first-time sign-in");
        }
        const emailAddress = rawEmail.trim().toLowerCase();

        let fullName = credentials.fullName as string | undefined;
        if (!fullName) {
          const givenName = credentials.givenName as string | undefined;
          const familyName = credentials.familyName as string | undefined;
          if (givenName || familyName) {
            fullName = [givenName, familyName].filter(Boolean).join(" ");
          }
        }
        if (!fullName) {
          fullName = emailAddress
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .split(" ")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        const username =
          (credentials.givenName as string) || emailAddress.split("@")[0];

        const created = await createAccount(ctx, {
          provider: "apple",
          account: { id: appleUserId },
          profile: {
            email: emailAddress,
            emailVerified: true,
            fullname: fullName,
            username,
            name: fullName,
          },
          shouldLinkViaEmail: true,
        });

        return { userId: created.user._id };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(rawCtx, args) {
      const ctx = rawCtx as MutationCtx;
      if (args.existingUserId !== null) {
        return args.existingUserId;
      }

      const rawEmail =
        typeof args.profile.email === "string" ? args.profile.email : undefined;
      const email = rawEmail?.trim().toLowerCase();

      if (email) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();

        if (existingUser) {
          if (!existingUser.emailVerificationTime) {
            await ctx.db.patch(existingUser._id, {
              emailVerificationTime: Date.now(),
            });
          }
          return existingUser._id;
        }
      }

      const fullname =
        typeof args.profile.fullname === "string"
          ? args.profile.fullname
          : typeof args.profile.name === "string"
            ? args.profile.name
            : undefined;
      const username =
        typeof args.profile.username === "string"
          ? args.profile.username
          : undefined;

      return await ctx.db.insert("users", {
        email,
        emailVerificationTime: Date.now(),
        fullname,
        name: fullname,
        username,
      });
    },
    async redirect({ redirectTo }) {
      const isAllowed =
        redirectTo.startsWith("http://localhost") ||
        redirectTo.startsWith("exp://") ||
        redirectTo.startsWith("pockito://") ||
        redirectTo.startsWith("com.lawrencejr.pockito://");

      if (isAllowed) {
        return redirectTo;
      }

      throw new Error(`Security Block: Invalid redirect to ${redirectTo}`);
    },
  },
});
