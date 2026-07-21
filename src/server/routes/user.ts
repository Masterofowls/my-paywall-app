// src/server/routes/user.ts
import { Router, Request, Response } from "express";
import { auth } from "../auth";
import { fromNodeHeaders } from "../utils/headers";
import { userHasPaidAccess } from "../services/access";

const router = Router();

router.get("/me", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const hasPaidAccess = await userHasPaidAccess(session.user.id);
    res.json({
      user: {
        ...session.user,
        hasPaidAccess,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.get("/has-access", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ hasAccess: false });
    }
    const hasAccess = await userHasPaidAccess(session.user.id);
    res.json({ hasAccess });
  } catch (error) {
    res.status(500).json({ error: "Failed to check access" });
  }
});

export default router;
