import { z } from "zod";
import { optionalString, optionalUuid, optionalNullableUuid, emptyToUndefined } from "./helpers.js";

export const createBoardSchema = z.object({
  name: z.string().min(1),
  description: optionalString,
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: optionalString,
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().transform(s => new Date(s)).optional(),
  assigneeId: optionalUuid,
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional().or(emptyToUndefined),
  description: optionalString,
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().transform(s => new Date(s)).optional(),
  assigneeId: optionalNullableUuid,
});
