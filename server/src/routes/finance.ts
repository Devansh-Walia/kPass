import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { financeService } from "../services/financeService.js";
import { createCategorySchema, createTransactionSchema } from "../validators/finance.js";
import type { TransactionType } from "@prisma/client";

const router = Router();
router.use(authenticate, requireAppAccess("finance"));

router.get("/categories", async (_req, res) => {
  const categories = await financeService.listCategories();
  res.json({ data: categories });
});

router.post("/categories", async (req, res) => {
  const body = createCategorySchema.parse(req.body);
  const category = await financeService.createCategory(body);
  res.status(201).json({ data: category });
});

router.get("/transactions", async (req, res) => {
  const { startDate, endDate, type, categoryId } = req.query;
  const transactions = await financeService.listTransactions({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    type: type as TransactionType | undefined,
    categoryId: categoryId as string | undefined,
  });
  res.json({ data: transactions });
});

router.post("/transactions", async (req, res) => {
  const body = createTransactionSchema.parse(req.body);
  const transaction = await financeService.createTransaction(body, req.user!.id);
  res.status(201).json({ data: transaction });
});

router.patch("/transactions/:id", async (req, res) => {
  const body = createTransactionSchema.partial().parse(req.body);
  const transaction = await financeService.updateTransaction(req.params.id, body);
  res.json({ data: transaction });
});

router.delete("/transactions/:id", async (_req, res) => {
  await financeService.deleteTransaction(_req.params.id);
  res.json({ data: { message: "Transaction deleted" } });
});

router.delete("/categories/:id", async (_req, res) => {
  await financeService.deleteCategory(_req.params.id);
  res.json({ data: { message: "Category deleted" } });
});

router.get("/reports", async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
  const report = await financeService.getReport(new Date(startDate as string), new Date(endDate as string));
  res.json({ data: report });
});

export default router;
