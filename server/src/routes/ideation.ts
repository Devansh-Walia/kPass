import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { ideationService } from "../services/ideationService.js";
import { createIdeaSchema, updateIdeaSchema } from "../validators/ideation.js";
import type { IdeaStage } from "@prisma/client";

const router = Router();
router.use(authenticate, requireAppAccess("ideation"));

router.get("/ideas", async (req, res) => {
  const stage = req.query.stage as string | undefined;
  const ideas = await ideationService.listIdeas(stage as IdeaStage | undefined);
  res.json({ data: ideas });
});

router.post("/ideas", async (req, res) => {
  const body = createIdeaSchema.parse(req.body);
  const idea = await ideationService.createIdea(body, req.user!.id);
  res.status(201).json({ data: idea });
});

router.patch("/ideas/:id", async (req, res) => {
  const body = updateIdeaSchema.parse(req.body);
  const idea = await ideationService.updateIdea(req.params.id as string, body);
  res.json({ data: idea });
});

router.post("/ideas/:id/vote", async (req, res) => {
  const idea = await ideationService.voteIdea(req.params.id as string);
  res.json({ data: idea });
});

router.delete("/ideas/:id", async (req, res) => {
  await ideationService.deleteIdea(req.params.id as string);
  res.json({ data: { success: true } });
});

export default router;
