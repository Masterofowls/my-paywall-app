// src/server/services/access.ts
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { user } from "../../db/schema";

export async function grantPaidAccess(userId: string) {
  await db
    .update(user)
    .set({
      hasPaidAccess: true,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

export async function userHasPaidAccess(userId: string): Promise<boolean> {
  const rows = await db
    .select({ hasPaidAccess: user.hasPaidAccess })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return Boolean(rows[0]?.hasPaidAccess);
}
