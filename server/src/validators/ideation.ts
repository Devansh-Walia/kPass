import { z } from "zod";
import { emptyToUndefined } from "./helpers.js";

export const createIdeaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).optional().or(emptyToUndefined),
  description: z.string().min(1).optional().or(emptyToUndefined),
  stage: z.enum(["IDEA", "APPROVED", "IN_PROGRESS", "DONE"]).optional(),
});
