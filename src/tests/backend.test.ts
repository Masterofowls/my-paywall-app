// src/tests/backend.test.ts
import request from "supertest";
import express from "express";
import paymentRoutes from "@/server/routes/payment";
import userRoutes from "@/server/routes/user";
import { handleStripeWebhook } from "@/server/webhooks/stripe";
import { auth } from "@/server/auth";
import { grantPaidAccess, userHasPaidAccess } from "@/server/services/access";

const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  customers: { create: jest.fn() },
  webhooks: { constructEvent: jest.fn() },
};

jest.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("stripe", () => jest.fn().mockImplementation(() => mockStripe));

jest.mock("@/db", () => ({
  db: {},
}));

jest.mock("@/server/services/access", () => ({
  grantPaidAccess: jest.fn().mockResolvedValue(undefined),
  userHasPaidAccess: jest.fn().mockResolvedValue(false),
}));

describe("Backend Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", paymentRoutes);
    app.use("/api", userRoutes);
    app.post(
      "/webhook",
      express.raw({ type: "application/json" }),
      handleStripeWebhook,
    );
    jest.clearAllMocks();
  });

  describe("Payment Routes", () => {
    it("creates checkout session successfully", async () => {
      const mockSession = {
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      };
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(mockSession);
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/test",
      });

      const response = await request(app)
        .post("/api/create-checkout-session")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.url).toBe("https://checkout.stripe.com/pay/test");
    });

    it("returns 401 when not authenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(null);
      const response = await request(app)
        .post("/api/create-checkout-session")
        .send({});
      expect(response.status).toBe(401);
    });

    it("handles Stripe errors gracefully", async () => {
      const mockSession = {
        user: { id: "user_123", name: "Test User", email: "test@example.com" },
      };
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(mockSession);
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error("Stripe error"),
      );

      const response = await request(app)
        .post("/api/create-checkout-session")
        .send({});
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to create checkout");
    });

    it("confirms paid checkout and grants access", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce({
        user: { id: "user_123" },
      });
      mockStripe.checkout.sessions.retrieve.mockResolvedValueOnce({
        payment_status: "paid",
        status: "complete",
        metadata: { userId: "user_123" },
      });

      const response = await request(app)
        .post("/api/confirm-checkout")
        .send({ sessionId: "cs_test_123" });

      expect(response.status).toBe(200);
      expect(response.body.hasAccess).toBe(true);
      expect(grantPaidAccess).toHaveBeenCalledWith("user_123");
    });
  });

  describe("User Routes", () => {
    it("gets user data when authenticated", async () => {
      const mockUser = {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
      };
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (userHasPaidAccess as jest.Mock).mockResolvedValueOnce(false);

      const response = await request(app).get("/api/me");
      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        ...mockUser,
        hasPaidAccess: false,
      });
    });

    it("returns 401 for /me when not authenticated", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(null);
      const response = await request(app).get("/api/me");
      expect(response.status).toBe(401);
    });

    it("checks access status", async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce({
        user: { id: "user_123" },
      });
      (userHasPaidAccess as jest.Mock).mockResolvedValueOnce(true);
      const response = await request(app).get("/api/has-access");
      expect(response.status).toBe(200);
      expect(response.body.hasAccess).toBe(true);
    });
  });

  describe("Webhook Handler", () => {
    it("handles checkout.session.completed", async () => {
      const mockEvent = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            mode: "payment",
            metadata: { userId: "user_123" },
            payment_intent: "pi_test_123",
          },
        },
      };
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const response = await request(app)
        .post("/webhook")
        .set("stripe-signature", "test_signature")
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(grantPaidAccess).toHaveBeenCalledWith("user_123");
    });

    it("returns 400 for invalid signature", async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error("bad signature");
      });
      const mockEvent = {
        type: "checkout.session.completed",
        data: { object: {} },
      };
      const response = await request(app)
        .post("/webhook")
        .set("stripe-signature", "invalid")
        .send(mockEvent);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid signature");
    });
  });
});
