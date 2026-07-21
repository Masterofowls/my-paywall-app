// src/server/routes/payment.ts
import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { auth } from "../auth";
import { fromNodeHeaders } from "../utils/headers";
import { grantPaidAccess } from "../services/access";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

router.post("/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Premium Video Access" },
            unit_amount: 1999,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.BETTER_AUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/pricing`,
      metadata: { userId: session.user.id },
      client_reference_id: session.user.id,
    });

    res.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout" });
  }
});

/** Confirm a completed Stripe Checkout session and unlock access (local-friendly). */
router.post("/confirm-checkout", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessionId = req.body?.sessionId as string | undefined;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);

    const paid =
      checkout.payment_status === "paid" || checkout.status === "complete";
    if (!paid) {
      return res.status(400).json({ error: "Checkout not paid", hasAccess: false });
    }

    const checkoutUserId =
      checkout.metadata?.userId || checkout.client_reference_id;
    if (checkoutUserId && checkoutUserId !== session.user.id) {
      return res.status(403).json({ error: "Checkout does not belong to user" });
    }

    await grantPaidAccess(session.user.id);
    res.json({ hasAccess: true });
  } catch (error) {
    console.error("Confirm checkout error:", error);
    res.status(500).json({ error: "Failed to confirm checkout" });
  }
});

export default router;
