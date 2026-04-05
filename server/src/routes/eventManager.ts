import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { eventManagerService } from "../services/eventManagerService.js";
import { createEventSchema, updateEventSchema, addVolunteerSchema } from "../validators/eventManager.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";

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

router.delete("/events/:id", async (req, res) => {
  await eventManagerService.deleteEvent(req.params.id as string);
  res.json({ data: { success: true } });
});

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "event") {
    const result = await processBulkImport({
      rows,
      schema: createEventSchema,
      createFn: (data, userId) => eventManagerService.createEvent(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: event` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    event: {
      fields: [
        { key: "title", label: "Title", type: "string", required: true },
        { key: "description", label: "Description", type: "string", required: false },
        { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
        { key: "location", label: "Location", type: "string", required: false },
        { key: "budget", label: "Budget", type: "number", required: false },
      ],
      example: { title: "Annual Day Celebration", description: "Cultural performances by students", date: "2025-12-15", location: "Community Hall", budget: 25000 },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
