// src/server/webhooks/stripe.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { grantPaidAccess } from "../services/access";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );

    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const userId = checkout.metadata?.userId;
      if (userId) {
        await grantPaidAccess(userId);
        console.info("Granted paid access to", userId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({ error: "Invalid signature" });
  }
}
