// src/tests/setup.ts
import { TextEncoder, TextDecoder } from "node:util";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "@jest/globals";

Object.assign(globalThis, { TextEncoder, TextDecoder });

global.fetch = jest.fn();

console.error = jest.fn();
console.warn = jest.fn();

const locationState = {
  href: "http://localhost/",
  origin: "http://localhost",
  pathname: "/",
  search: "",
  hash: "",
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

delete (window as any).location;
(window as any).location = locationState;

Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: {
    randomUUID: () => "test-uuid-123",
  },
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  locationState.href = "http://localhost/";
});

process.env.VITE_API_URL = "http://localhost:5173";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.BETTER_AUTH_SECRET = "test-secret-key-at-least-32-chars!!";
process.env.BETTER_AUTH_URL = "http://localhost:5173";
