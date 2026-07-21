// src/tests/mocks/better-auth-client.ts
export const createAuthClient = () => ({
  getSession: jest.fn(),
  signIn: { email: jest.fn() },
  signUp: { email: jest.fn() },
  signOut: jest.fn(),
});
