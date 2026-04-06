import { z } from "zod";

/** Transform empty/whitespace-only strings to undefined so optional fields are treated as "not provided" */
const emptyToUndefined = z.literal("").transform(() => undefined);

/** Optional string that treats "" as undefined */
const optionalString = z.string().min(1).optional().or(emptyToUndefined);

/** Optional email that treats "" as undefined, validates non-empty values as email */
const optionalEmail = z.string().email().optional().or(emptyToUndefined);

/** Optional UUID that treats "" as undefined */
const optionalUuid = z.string().uuid().optional().nullable().or(emptyToUndefined);

/** Optional enum that treats "" as undefined */
const optionalStage = z.enum(["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"]).optional().or(emptyToUndefined);
const optionalActivityType = z.enum(["CALL", "EMAIL", "NOTE", "MEETING"]).optional().nullable().or(emptyToUndefined);

export const createContactSchema = z.object({
  name: z.string().min(1),
  email: optionalEmail,
  phone: optionalString,
  company: optionalString,
  tags: z.array(z.string()).default([]),
  notes: optionalString,
});

export const updateContactSchema = z.object({
  name: z.string().min(1).optional().or(emptyToUndefined),
  email: optionalEmail,
  phone: optionalString,
  company: optionalString,
  tags: z.array(z.string()).optional(),
  notes: optionalString,
});

export const createDealSchema = z.object({
  title: z.string().min(1),
  value: z.number().min(0).optional().nullable(),
  stage: optionalStage.default("LEAD"),
  contactId: optionalUuid,
});

export const updateDealSchema = z.object({
  title: z.string().min(1).optional().or(emptyToUndefined),
  value: z.number().min(0).optional().nullable(),
  stage: optionalStage,
  contactId: optionalUuid,
});

export const createActivitySchema = z.object({
  contactId: optionalUuid,
  type: optionalActivityType,
  content: z.string().min(1),
});
