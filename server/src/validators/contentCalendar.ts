import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TWITTER", "OTHER"]),
  scheduledDate: z.string().transform(s => new Date(s)),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).default("DRAFT"),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TWITTER", "OTHER"]).optional(),
  scheduledDate: z.string().transform(s => new Date(s)).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional(),
});
