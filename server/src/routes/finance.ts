import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { financeService } from "../services/financeService.js";
import { createCategorySchema, createTransactionSchema } from "../validators/finance.js";

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
    type: type as "INCOME" | "EXPENSE" | undefined,
    categoryId: categoryId as string | undefined,
  });
  res.json({ data: transactions });
});

router.post("/transactions", async (req, res) => {
  const body = createTransactionSchema.parse(req.body);
  const transaction = await financeService.createTransaction(body, req.user!.id);
  res.status(201).json({ data: transaction });
});

router.get("/reports", async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
  const report = await financeService.getReport(new Date(startDate as string), new Date(endDate as string));
  res.json({ data: report });
});

export default router;
