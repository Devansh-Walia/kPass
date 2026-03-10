import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { eventManagerService } from "../services/eventManagerService.js";
import { createEventSchema, updateEventSchema, addVolunteerSchema } from "../validators/eventManager.js";

const router = Router();
router.use(authenticate, requireAppAccess("event-manager"));

router.get("/events", async (req, res) => {
  const events = await eventManagerService.listEvents(req.query.status as string | undefined);
  res.json({ data: events });
});

router.post("/events", async (req, res) => {
  const body = createEventSchema.parse(req.body);
  const event = await eventManagerService.createEvent(body, req.user!.id);
  res.status(201).json({ data: event });
});

router.get("/events/:id", async (req, res) => {
  const event = await eventManagerService.getEvent(req.params.id as string);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json({ data: event });
});

router.patch("/events/:id", async (req, res) => {
  const body = updateEventSchema.parse(req.body);
  const event = await eventManagerService.updateEvent(req.params.id as string, body);
  res.json({ data: event });
});

router.post("/events/:id/volunteers", async (req, res) => {
  const body = addVolunteerSchema.parse(req.body);
  const volunteer = await eventManagerService.addVolunteer(req.params.id as string, body);
  res.status(201).json({ data: volunteer });
});

router.delete("/events/:id/volunteers/:userId", async (req, res) => {
  await eventManagerService.removeVolunteer(req.params.id as string, req.params.userId as string);
  res.json({ data: { success: true } });
});

export default router;
