// src/tests/hooks.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/hooks/useAuth";
import { usePayment } from "@/lib/hooks/usePayment";
import { authClient } from "@/lib/auth-client";
import { navigateTo } from "@/lib/navigation";

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: jest.fn(),
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
  },
}));

jest.mock("@/lib/navigation", () => ({
  navigateTo: jest.fn(),
  reloadPage: jest.fn(),
}));

const mockAuthClient = authClient as any;

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("Hook Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("useAuth", () => {
    it("fetches session on mount", async () => {
      const mockUser = { id: "user_123", name: "Test", email: "test@test.com" };
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser, session: {} },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.user).toEqual(mockUser);
    });

    it("handles no session", async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({ data: null });
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.user).toBeNull();
    });

    it("handles login", async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({ data: null });
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: { user: { id: "1", email: "test@test.com" } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login("test@test.com", "password");
      });

      expect(mockAuthClient.signIn.email).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password",
      });
      expect(navigateTo).toHaveBeenCalledWith("/dashboard");
    });

    it("handles login error", async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({ data: null });
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        error: { message: "Invalid credentials" },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.login("test@test.com", "wrong"),
        ).rejects.toThrow("Invalid credentials");
      });
    });

    it("handles signup", async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({ data: null });
      mockAuthClient.signUp.email.mockResolvedValueOnce({
        data: { user: { id: "1" } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.signup("Test User", "test@test.com", "password");
      });

      expect(mockAuthClient.signUp.email).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@test.com",
        password: "password",
      });
      expect(navigateTo).toHaveBeenCalledWith("/dashboard");
    });

    it("handles logout", async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: { id: "1" }, session: {} },
      });
      mockAuthClient.signOut.mockResolvedValueOnce({});

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthClient.signOut).toHaveBeenCalled();
      expect(navigateTo).toHaveBeenCalledWith("/");
    });
  });

  describe("usePayment", () => {
    it("creates checkout session", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ url: "https://test.com" }),
      });

      const { result } = renderHook(() => usePayment());

      await act(async () => {
        await result.current.createCheckout();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/create-checkout-session", {
        method: "POST",
        credentials: "include",
      });
      expect(navigateTo).toHaveBeenCalledWith("https://test.com");
    });

    it("checks access", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ hasAccess: true }),
      });

      const { result } = renderHook(() => usePayment());
      let access = false;
      await act(async () => {
        access = await result.current.checkAccess();
      });

      expect(access).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("/api/has-access", {
        credentials: "include",
      });
    });

    it("returns false when access check fails", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network"));
      const { result } = renderHook(() => usePayment());
      let access = true;
      await act(async () => {
        access = await result.current.checkAccess();
      });
      expect(access).toBe(false);
    });
  });
});
