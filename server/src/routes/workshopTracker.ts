import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { workshopTrackerService } from "../services/workshopTrackerService.js";
import { createWorkshopSchema, updateWorkshopSchema, addParticipantSchema } from "../validators/workshopTracker.js";

const router = Router();
router.use(authenticate, requireAppAccess("workshop-tracker"));

router.get("/workshops", async (_req, res) => {
  const workshops = await workshopTrackerService.listWorkshops();
  res.json({ data: workshops });
});

router.post("/workshops", async (req, res) => {
  const body = createWorkshopSchema.parse(req.body);
  const workshop = await workshopTrackerService.createWorkshop(body, req.user!.id);
  res.status(201).json({ data: workshop });
});

router.get("/workshops/:id", async (req, res) => {
  const workshop = await workshopTrackerService.getWorkshop(req.params.id as string);
  if (!workshop) return res.status(404).json({ error: "Workshop not found" });
  res.json({ data: workshop });
});

router.patch("/workshops/:id", async (req, res) => {
  const body = updateWorkshopSchema.parse(req.body);
  const workshop = await workshopTrackerService.updateWorkshop(req.params.id as string, body);
  res.json({ data: workshop });
});

router.post("/workshops/:id/participants", async (req, res) => {
  const body = addParticipantSchema.parse(req.body);
  const participant = await workshopTrackerService.addParticipant(req.params.id as string, body);
  res.status(201).json({ data: participant });
});

router.patch("/participants/:id/attendance", async (req, res) => {
  const participant = await workshopTrackerService.toggleAttendance(req.params.id as string);
  res.json({ data: participant });
});

export default router;
