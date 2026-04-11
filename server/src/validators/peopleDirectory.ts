import { z } from "zod";
import { optionalString, optionalEmail, emptyToUndefined } from "./helpers.js";

export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: optionalEmail,
  phone: optionalString,
  department: z.string().min(1),
  designation: z.string().min(1),
  joinDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional().or(emptyToUndefined),
  email: optionalEmail,
  phone: optionalString,
  department: z.string().min(1).optional().or(emptyToUndefined),
  designation: z.string().min(1).optional().or(emptyToUndefined),
  joinDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  isActive: z.boolean().optional(),
});
