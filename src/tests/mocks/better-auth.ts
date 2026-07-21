// src/tests/mocks/better-auth.ts
export const mockAuth = {
  api: {
    getSession: jest.fn().mockResolvedValue({
      user: {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
        hasPaidAccess: false,
      },
      session: { id: "session_123" },
    }),
  },
  handler: jest.fn(),
  signIn: { email: jest.fn() },
  signUp: { email: jest.fn() },
  signOut: jest.fn(),
};

export const betterAuth = jest.fn(() => mockAuth);
