import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { appService } from "../services/appService.js";
import { createAppSchema, updateAppSchema } from "../validators/apps.js";

const router = Router();

// GET /api/apps — admin gets all, member gets assigned
router.get("/", authenticate, async (req, res) => {
  const apps = req.user!.role === "ADMIN"
    ? await appService.listAll()
    : await appService.listForUser(req.user!.id);
  res.json({ data: apps });
});

// POST /api/apps — admin only
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const body = createAppSchema.parse(req.body);
  const app = await appService.create(body);
  res.status(201).json({ data: app });
});

// PATCH /api/apps/:id — admin only
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const body = updateAppSchema.parse(req.body);
  const app = await appService.update(req.params.id as string, body);
  res.json({ data: app });
});

export default router;
