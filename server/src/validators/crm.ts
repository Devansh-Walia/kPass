import { z } from "zod";
import { emptyToUndefined, optionalString, optionalEmail, optionalNullableUuid } from "./helpers.js";

/** CRM-specific optional enums that treat "" as undefined */
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
  contactId: optionalNullableUuid,
});

export const updateDealSchema = z.object({
  title: z.string().min(1).optional().or(emptyToUndefined),
  value: z.number().min(0).optional().nullable(),
  stage: optionalStage,
  contactId: optionalNullableUuid,
});

export const createActivitySchema = z.object({
  contactId: optionalNullableUuid,
  type: optionalActivityType,
  content: z.string().min(1),
});
