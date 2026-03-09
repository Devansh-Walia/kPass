// server/src/routes/me.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { changePasswordSchema } from "../validators/auth.js";
import { hashPassword, comparePassword } from "../lib/password.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true, mustChangePassword: true,
      apps: { include: { app: true } },
    },
  });
  res.json({ data: user });
});

router.patch("/password", async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  });
  res.json({ data: { message: "Password updated" } });
});

export default router;
