// src/lib/auth-session.ts
/** Normalize Better Auth client responses to a user object. */
export function getUserFromAuthResult(result: any) {
  if (!result) return null;
  if (result.error) return null;
  return result.data?.user ?? result.user ?? null;
}
