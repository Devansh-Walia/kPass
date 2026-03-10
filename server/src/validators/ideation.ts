import { z } from "zod";

export const createIdeaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  stage: z.enum(["IDEA", "APPROVED", "IN_PROGRESS", "DONE"]).optional(),
});
