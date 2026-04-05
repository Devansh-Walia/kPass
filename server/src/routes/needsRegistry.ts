import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { needsRegistryService } from "../services/needsRegistryService.js";
import { createNeedSchema, updateNeedSchema, updateNeedStatusSchema } from "../validators/needsRegistry.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";

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

router.put("/requests/:id", async (req, res) => {
  const body = updateNeedSchema.parse(req.body);
  const request = await needsRegistryService.updateRequest(req.params.id as string, body);
  res.json({ data: request });
});

router.patch("/requests/:id", async (req, res) => {
  const body = updateNeedStatusSchema.parse(req.body);
  const request = await needsRegistryService.updateStatus(req.params.id as string, body);
  res.json({ data: request });
});

router.delete("/requests/:id", requireAdmin, async (_req, res) => {
  await needsRegistryService.deleteRequest(_req.params.id as string);
  res.json({ data: { success: true } });
});

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "request") {
    const result = await processBulkImport({
      rows,
      schema: createNeedSchema,
      createFn: (data, userId) => needsRegistryService.createRequest(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: request` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    request: {
      fields: [
        { key: "childName", label: "Child Name", type: "string", required: true },
        { key: "category", label: "Category", type: "enum", required: true, enumValues: ["SANITATION", "HEALTH", "SUPPLIES", "OTHER"] },
        { key: "description", label: "Description", type: "string", required: true },
      ],
      example: { childName: "Priya", category: "SUPPLIES", description: "Needs school bag and notebooks" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
