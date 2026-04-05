import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { workshopTrackerService } from "../services/workshopTrackerService.js";
import { createWorkshopSchema, updateWorkshopSchema, addParticipantSchema } from "../validators/workshopTracker.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";

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

router.delete("/workshops/:id", async (req, res) => {
  await workshopTrackerService.deleteWorkshop(req.params.id as string);
  res.json({ data: { success: true } });
});

router.delete("/participants/:id", async (req, res) => {
  await workshopTrackerService.removeParticipant(req.params.id as string);
  res.json({ data: { success: true } });
});

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "workshop") {
    const result = await processBulkImport({
      rows,
      schema: createWorkshopSchema,
      createFn: (data, userId) => workshopTrackerService.createWorkshop(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: workshop` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    workshop: {
      fields: [
        { key: "title", label: "Title", type: "string", required: true },
        { key: "description", label: "Description", type: "string", required: false },
        { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
        { key: "instructor", label: "Instructor", type: "string", required: true },
        { key: "materialsNeeded", label: "Materials Needed", type: "string", required: false },
        { key: "maxParticipants", label: "Max Participants", type: "number", required: false },
      ],
      example: { title: "Art & Craft Workshop", description: "Paper craft basics", date: "2025-04-10", instructor: "Meera Patel", materialsNeeded: "Coloured paper, scissors, glue", maxParticipants: 30 },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
