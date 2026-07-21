// src/server/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-me-at-least-32-chars",
  basePath: "/api/auth",

  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      hasPaidAccess: { type: "boolean", required: false, defaultValue: false },
      stripeCustomerId: { type: "string", required: false },
    },
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:5173",
    "http://localhost:3000",
  ],
});
