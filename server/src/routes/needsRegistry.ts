import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { needsRegistryService } from "../services/needsRegistryService.js";
import { createNeedSchema, updateNeedStatusSchema } from "../validators/needsRegistry.js";

const router = Router();
router.use(authenticate, requireAppAccess("needs-registry"));

router.get("/requests", async (req, res) => {
  const requests = await needsRegistryService.listRequests(req.query.status as string | undefined);
  res.json({ data: requests });
});

router.post("/requests", async (req, res) => {
  const body = createNeedSchema.parse(req.body);
  const request = await needsRegistryService.createRequest(body, req.user!.id);
  res.status(201).json({ data: request });
});

router.patch("/requests/:id", async (req, res) => {
  const body = updateNeedStatusSchema.parse(req.body);
  const request = await needsRegistryService.updateStatus(req.params.id as string, body);
  res.json({ data: request });
});

export default router;
