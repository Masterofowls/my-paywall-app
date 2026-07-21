// src/tests/mocks/stripe.ts
export const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/test",
        mode: "payment",
        metadata: { userId: "user_123" },
        payment_intent: "pi_test_123",
      }),
    },
  },
  customers: {
    create: jest.fn().mockResolvedValue({
      id: "cus_test_123",
      email: "test@example.com",
      name: "Test User",
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockImplementation((body, signature, secret) => {
      const parsed = JSON.parse(body);
      return {
        type: parsed.type,
        data: {
          object: parsed.data.object,
        },
      };
    }),
  },
};

export default jest.fn(() => mockStripe);
