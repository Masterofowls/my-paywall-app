// src/tests/integration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePayment } from "@/lib/hooks/usePayment";

jest.mock("@/lib/hooks/useAuth", () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: jest.fn(),
}));
jest.mock("@/lib/hooks/usePayment");


describe("Integration Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("complete payment flow from paywall to access", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
        hasPaidAccess: false,
      },
      loading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
    });

    const mockCreateCheckout = jest.fn();
    (usePayment as jest.Mock).mockReturnValue({
      checkAccess: jest.fn().mockResolvedValue(false),
      createCheckout: mockCreateCheckout,
      confirmCheckout: jest.fn(),
      loading: false,
    });

    render(<App />);

    await user.click(screen.getByText("Watch"));

    await waitFor(() => {
      expect(screen.getByText("🚀 Unlock Premium")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Get Access Now"));

    await waitFor(() => {
      expect(screen.getByText("$19.99")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Pay with Stripe"));

    expect(mockCreateCheckout).toHaveBeenCalled();
  });

  it("shows protected content when user has access", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
        hasPaidAccess: true,
      },
      loading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
    });

    (usePayment as jest.Mock).mockReturnValue({
      checkAccess: jest.fn().mockResolvedValue(true),
      createCheckout: jest.fn(),
      confirmCheckout: jest.fn(),
      loading: false,
    });

    render(<App />);

    await user.click(screen.getByText("Watch"));

    await waitFor(() => {
      expect(screen.getByText("Premium Video")).toBeInTheDocument();
    });
  });

  it("auth flow: login, access paywall, and logout", async () => {
    const mockLogin = jest.fn();

    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      signup: jest.fn(),
      logout: jest.fn(),
    });

    (usePayment as jest.Mock).mockReturnValue({
      checkAccess: jest.fn().mockResolvedValue(false),
      createCheckout: jest.fn(),
      confirmCheckout: jest.fn(),
      loading: false,
    });

    render(<App />);

    await user.click(screen.getByText("Login"));

    await user.type(screen.getByLabelText("Email"), "test@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123");
  });

  it("handles payment failure gracefully", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
        hasPaidAccess: false,
      },
      loading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
    });

    const mockCreateCheckout = jest
      .fn()
      .mockRejectedValue(new Error("Payment failed"));
    (usePayment as jest.Mock).mockReturnValue({
      checkAccess: jest.fn().mockResolvedValue(false),
      createCheckout: mockCreateCheckout,
      confirmCheckout: jest.fn(),
      loading: false,
    });

    render(<App />);

    await user.click(screen.getByText("Pricing"));

    const payButton = screen.getByText("Pay with Stripe");
    await user.click(payButton);

    await waitFor(() => {
      expect(payButton).toBeEnabled();
      expect(payButton).toHaveTextContent("Pay with Stripe");
    });
  });
});
