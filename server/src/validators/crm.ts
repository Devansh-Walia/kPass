import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const createDealSchema = z.object({
  title: z.string().min(1),
  value: z.number().min(0),
  stage: z.enum(["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"]).default("LEAD"),
  contactId: z.string().uuid(),
});

export const updateDealSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().min(0).optional(),
  stage: z.enum(["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"]).optional(),
});

export const createActivitySchema = z.object({
  contactId: z.string().uuid(),
  type: z.enum(["CALL", "EMAIL", "NOTE", "MEETING"]),
  content: z.string().min(1),
});
