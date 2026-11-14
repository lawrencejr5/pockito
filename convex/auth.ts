import Google from "@auth/core/providers/google";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  convexAuth,
  createAccount,
  retrieveAccount,
} from "@convex-dev/auth/server";

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
        return {
          id: googleProfile.sub,
          email: googleProfile.email,
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

        const emailAddress = payload.email || (credentials.email as string);
        if (!emailAddress) {
          throw new Error("Email address is required for first-time sign-in");
        }

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
