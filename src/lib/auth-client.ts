// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

// Same-origin in production when VITE_API_URL is unset at build
const baseURL =
  (typeof process !== "undefined" && process.env.VITE_API_URL) ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173");

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, getSession } = authClient;
