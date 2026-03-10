import { z } from "zod";

export const createDonorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "CORPORATE"]),
  notes: z.string().optional(),
});

export const updateDonorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "CORPORATE"]).optional(),
  notes: z.string().optional(),
});

export const createDonationSchema = z.object({
  donorId: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string().transform((s) => new Date(s)),
  purpose: z.string().optional(),
  receiptNo: z.string().optional(),
});
