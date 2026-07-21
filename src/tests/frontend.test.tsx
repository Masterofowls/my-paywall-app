// src/tests/frontend.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { PaywallGuard } from "@/components/Payment/PaywallGuard";
import { CheckoutButton } from "@/components/Payment/CheckoutButton";
import { LoginForm } from "@/components/Auth/LoginForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePayment } from "@/lib/hooks/usePayment";

jest.mock("@/lib/hooks/useAuth");
jest.mock("@/lib/hooks/usePayment");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;

describe("Component Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue({
      checkAccess: jest.fn(),
      createCheckout: jest.fn(),
      confirmCheckout: jest.fn(),
      loading: false,
    });
  });

  describe("PaywallGuard", () => {
    it("shows loading state", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <PaywallGuard>
            <div>Protected</div>
          </PaywallGuard>
        </BrowserRouter>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows login prompt when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <PaywallGuard>
            <div>Protected</div>
          </PaywallGuard>
        </BrowserRouter>,
      );

      expect(screen.getByText("🔒 Sign in Required")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });

    it("shows paywall when user has no access", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          name: "Test",
          email: "test@test.com",
          hasPaidAccess: false,
        },
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
      });

      mockUsePayment.mockReturnValue({
        checkAccess: jest.fn().mockResolvedValue(false),
        createCheckout: jest.fn(),
        confirmCheckout: jest.fn(),
        loading: false,
      });

      render(
        <BrowserRouter>
          <PaywallGuard>
            <div>Protected</div>
          </PaywallGuard>
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("🚀 Unlock Premium")).toBeInTheDocument();
        expect(screen.getByText("$19.99")).toBeInTheDocument();
      });
    });

    it("shows content when user has access", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          name: "Test",
          email: "test@test.com",
          hasPaidAccess: true,
        },
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
      });

      mockUsePayment.mockReturnValue({
        checkAccess: jest.fn().mockResolvedValue(true),
        createCheckout: jest.fn(),
        confirmCheckout: jest.fn(),
        loading: false,
      });

      render(
        <BrowserRouter>
          <PaywallGuard>
            <div>Protected Content</div>
          </PaywallGuard>
        </BrowserRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });
  });

  describe("CheckoutButton", () => {
    it("renders with correct text", () => {
      mockUsePayment.mockReturnValue({
        createCheckout: jest.fn(),
        checkAccess: jest.fn(),
        confirmCheckout: jest.fn(),
        loading: false,
      });

      render(<CheckoutButton />);
      expect(screen.getByText("Pay with Stripe")).toBeInTheDocument();
    });

    it("shows loading state", () => {
      mockUsePayment.mockReturnValue({
        createCheckout: jest.fn(),
        checkAccess: jest.fn(),
        confirmCheckout: jest.fn(),
        loading: true,
      });

      render(<CheckoutButton />);
      expect(screen.getByText("Processing...")).toBeInTheDocument();
      expect(screen.getByText("Processing...")).toBeDisabled();
    });

    it("calls createCheckout on click", async () => {
      const mockCreateCheckout = jest.fn();
      mockUsePayment.mockReturnValue({
        createCheckout: mockCreateCheckout,
        checkAccess: jest.fn(),
        confirmCheckout: jest.fn(),
        loading: false,
      });

      render(<CheckoutButton />);
      const button = screen.getByText("Pay with Stripe");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCreateCheckout).toHaveBeenCalledTimes(1);
      });
    });

    it("handles errors gracefully", async () => {
      const mockError = new Error("Payment failed");
      mockUsePayment.mockReturnValue({
        createCheckout: jest.fn().mockRejectedValue(mockError),
        checkAccess: jest.fn(),
        confirmCheckout: jest.fn(),
        loading: false,
      });

      render(<CheckoutButton />);
      const button = screen.getByText("Pay with Stripe");
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeEnabled();
      });
    });
  });

  describe("LoginForm", () => {
    it("renders login form", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>,
      );

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    });

    it("toggles to signup mode", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>,
      );

      await user.click(screen.getByRole("button", { name: "Sign Up" }));

      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Account" }),
      ).toBeInTheDocument();
    });

    it("handles login submission", async () => {
      const mockLogin = jest.fn();
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: mockLogin,
        signup: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>,
      );

      await user.type(screen.getByLabelText("Email"), "test@test.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123");
      });
    });

    it("handles signup submission", async () => {
      const mockSignup = jest.fn();
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        signup: mockSignup,
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>,
      );

      await user.click(screen.getByRole("button", { name: "Sign Up" }));

      await user.type(screen.getByLabelText("Name"), "Test User");
      await user.type(screen.getByLabelText("Email"), "test@test.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Create Account" }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          "Test User",
          "test@test.com",
          "password123",
        );
      });
    });

    it("shows error message on auth failure", async () => {
      const mockLogin = jest
        .fn()
        .mockRejectedValue(new Error("Invalid credentials"));
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: mockLogin,
        signup: jest.fn(),
        logout: jest.fn(),
      });

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>,
      );

      await user.type(screen.getByLabelText("Email"), "test@test.com");
      await user.type(screen.getByLabelText("Password"), "wrong");
      await user.click(screen.getByRole("button", { name: "Sign In" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });
  });
});
