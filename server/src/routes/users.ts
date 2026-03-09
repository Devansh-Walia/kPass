import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { userService } from "../services/userService.js";
import { createUserSchema, updateUserSchema } from "../validators/users.js";
import { prisma } from "../lib/prisma.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/", async (req, res) => {
  const users = await userService.list();
  res.json({ data: users });
});

router.get("/:id", async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ data: user });
});

router.post("/", async (req, res) => {
  const body = createUserSchema.parse(req.body);
  const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
  try {
    const user = await userService.create(body, admin!.orgId);
    res.status(201).json({ data: user });
  } catch (err: any) {
    if (err.message === "Email already exists") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

router.patch("/:id", async (req, res) => {
  const body = updateUserSchema.parse(req.body);
  const user = await userService.update(req.params.id, body);
  res.json({ data: user });
});

router.delete("/:id", async (req, res) => {
  await userService.softDelete(req.params.id);
  res.json({ data: { message: "User deactivated" } });
});

// App assignment endpoints
router.post("/:id/apps", async (req, res) => {
  const { appIds } = req.body;
  await prisma.userApp.createMany({
    data: appIds.map((appId: string) => ({ userId: req.params.id, appId, assignedById: req.user!.id })),
    skipDuplicates: true,
  });
  res.status(201).json({ data: { message: "Apps assigned" } });
});

router.delete("/:id/apps/:appId", async (req, res) => {
  await prisma.userApp.delete({
    where: { userId_appId: { userId: req.params.id, appId: req.params.appId } },
  });
  res.json({ data: { message: "App access revoked" } });
});

export default router;
