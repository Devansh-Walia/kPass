import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { contentCalendarService } from "../services/contentCalendarService.js";
import { createPostSchema, updatePostSchema } from "../validators/contentCalendar.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";

const router = Router();
router.use(authenticate, requireAppAccess("content-calendar"));

router.get("/posts", async (req, res) => {
  const { platform, status, month, year } = req.query;
  const posts = await contentCalendarService.listPosts({
    platform: platform as string | undefined,
    status: status as string | undefined,
    month: month ? parseInt(month as string) : undefined,
    year: year ? parseInt(year as string) : undefined,
  });
  res.json({ data: posts });
});

router.post("/posts", async (req, res) => {
  const body = createPostSchema.parse(req.body);
  const post = await contentCalendarService.createPost(body, req.user!.id);
  res.status(201).json({ data: post });
});

router.patch("/posts/:id", async (req, res) => {
  const body = updatePostSchema.parse(req.body);
  const post = await contentCalendarService.updatePost(req.params.id as string, body);
  res.json({ data: post });
});

router.delete("/posts/:id", async (req, res) => {
  await contentCalendarService.deletePost(req.params.id as string);
  res.json({ data: { success: true } });
});

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "post") {
    const result = await processBulkImport({
      rows,
      schema: createPostSchema,
      createFn: (data, userId) => contentCalendarService.createPost(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: post` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    post: {
      fields: [
        { key: "title", label: "Title", type: "string", required: true },
        { key: "content", label: "Content", type: "string", required: false },
        { key: "platform", label: "Platform", type: "enum", required: true, enumValues: ["INSTAGRAM", "FACEBOOK", "TWITTER", "OTHER"] },
        { key: "scheduledDate", label: "Scheduled Date", type: "date", required: true, description: "YYYY-MM-DD format" },
        { key: "status", label: "Status", type: "enum", required: false, enumValues: ["DRAFT", "SCHEDULED", "PUBLISHED"], description: "Defaults to DRAFT" },
      ],
      example: { title: "World Environment Day", content: "Join us for a tree-planting drive!", platform: "INSTAGRAM", scheduledDate: "2025-06-05", status: "SCHEDULED" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
