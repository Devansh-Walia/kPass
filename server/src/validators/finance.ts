import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  date: z.string().transform(s => new Date(s)),
});
