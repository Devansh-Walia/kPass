import { z } from "zod";
import { optionalString, optionalEmail, emptyToUndefined } from "./helpers.js";

export const createDonorSchema = z.object({
  name: z.string().min(1),
  email: optionalEmail,
  phone: optionalString,
  type: z.enum(["INDIVIDUAL", "CORPORATE"]),
  notes: optionalString,
});

export const updateDonorSchema = z.object({
  name: z.string().min(1).optional().or(emptyToUndefined),
  email: optionalEmail,
  phone: optionalString,
  type: z.enum(["INDIVIDUAL", "CORPORATE"]).optional(),
  notes: optionalString,
});

export const createDonationSchema = z.object({
  donorId: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string().transform((s) => new Date(s)),
  purpose: optionalString,
  receiptNo: optionalString,
});
