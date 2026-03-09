import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  password: z.string().min(8),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  isActive: z.boolean().optional(),
});
