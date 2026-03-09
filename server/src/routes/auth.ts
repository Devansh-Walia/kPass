import { Router } from "express";
import { authService } from "../services/authService.js";
import { loginSchema } from "../validators/auth.js";
import { verifyRefreshToken } from "../lib/jwt.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  try {
    const result = await authService.login(email, password);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ data: { accessToken: result.accessToken, user: result.user } });
  } catch {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = verifyRefreshToken(token);
    const result = await authService.refresh(payload.userId, payload.role);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ data: { accessToken: result.accessToken, user: result.user } });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken");
  res.json({ data: { message: "Logged out" } });
});

export default router;
