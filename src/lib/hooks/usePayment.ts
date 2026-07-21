// src/lib/hooks/usePayment.ts
import { useState } from "react";
import { navigateTo } from "@/lib/navigation";

async function apiFetch(input: string, init?: RequestInit) {
  return fetch(input, {
    credentials: "include",
    ...init,
  });
}

export function usePayment() {
  const [loading, setLoading] = useState(false);

  const createCheckout = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/create-checkout-session", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) navigateTo(data.url);
    } catch (error) {
      console.error("Payment error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmCheckout = async (sessionId: string): Promise<boolean> => {
    const response = await apiFetch("/api/confirm-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    return Boolean(data.hasAccess);
  };

  const checkAccess = async (): Promise<boolean> => {
    try {
      const response = await apiFetch("/api/has-access");
      const data = await response.json();
      return data.hasAccess || false;
    } catch {
      return false;
    }
  };

  return { createCheckout, confirmCheckout, checkAccess, loading };
}
