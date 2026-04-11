import { z } from "zod";
import { optionalString } from "./helpers.js";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().uuid(),
  description: optionalString,
  date: z.string().transform(s => new Date(s)),
});
