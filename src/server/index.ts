// src/server/index.ts
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import paymentRoutes from "./routes/payment";
import userRoutes from "./routes/user";
import { handleStripeWebhook } from "./webhooks/stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";
const publicOrigin = process.env.BETTER_AUTH_URL || "http://localhost:5173";

app.use(
  cors({
    origin: publicOrigin,
    credentials: true,
  }),
);

// Stripe needs the raw body for signature verification.
app.post(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Better Auth must run before body parsers so it can read the raw request.
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.use("/api", paymentRoutes);
app.use("/api", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (isProd) {
  const distPath = path.resolve(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
