import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { contentCalendarService } from "../services/contentCalendarService.js";
import { createPostSchema, updatePostSchema } from "../validators/contentCalendar.js";

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

export default router;
