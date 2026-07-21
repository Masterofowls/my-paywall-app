// src/db/index.ts
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbFile =
  process.env.DATABASE_URL || path.join(process.cwd(), "data", "local.db");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const sqlite = new Database(dbFile);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

/** Create Better Auth + app tables if they do not exist yet. */
export function ensureTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL UNIQUE,
      "emailVerified" integer DEFAULT false NOT NULL,
      "image" text,
      "stripeCustomerId" text,
      "hasPaidAccess" integer DEFAULT false,
      "createdAt" integer DEFAULT (unixepoch()) NOT NULL,
      "updatedAt" integer DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "token" text NOT NULL UNIQUE,
      "expiresAt" integer NOT NULL,
      "ipAddress" text,
      "userAgent" text,
      "createdAt" integer DEFAULT (unixepoch()) NOT NULL,
      "updatedAt" integer DEFAULT (unixepoch()) NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "accountId" text NOT NULL,
      "providerId" text NOT NULL,
      "accessToken" text,
      "refreshToken" text,
      "accessTokenExpiresAt" integer,
      "refreshTokenExpiresAt" integer,
      "scope" text,
      "idToken" text,
      "password" text,
      "createdAt" integer DEFAULT (unixepoch()) NOT NULL,
      "updatedAt" integer DEFAULT (unixepoch()) NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY NOT NULL,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expiresAt" integer NOT NULL,
      "createdAt" integer DEFAULT (unixepoch()) NOT NULL,
      "updatedAt" integer DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payments" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "stripeCheckoutSessionId" text UNIQUE,
      "stripePaymentIntentId" text UNIQUE,
      "amount" integer NOT NULL,
      "currency" text DEFAULT 'usd' NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "createdAt" integer DEFAULT (unixepoch()) NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS "video_access" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "videoId" text NOT NULL,
      "grantedAt" integer DEFAULT (unixepoch()) NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade
    );
  `);
}

ensureTables();
