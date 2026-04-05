import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { financeService } from "../services/financeService.js";
import { createCategorySchema, createTransactionSchema } from "../validators/finance.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";
import { prisma } from "../lib/prisma.js";
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

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "category") {
    const result = await processBulkImport({
      rows,
      schema: createCategorySchema,
      createFn: (data) => financeService.createCategory(data),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  if (entity === "transaction") {
    const result = await processBulkImport({
      rows,
      schema: createTransactionSchema,
      createFn: (data, userId) => financeService.createTransaction(data, userId),
      userId: req.user!.id,
      resolveFn: async (row) => {
        // Resolve categoryName → categoryId
        if (row.categoryName && !row.categoryId) {
          const cat = await prisma.financeCategory.findFirst({
            where: { name: { equals: row.categoryName as string, mode: "insensitive" } },
          });
          if (!cat) throw new Error(`Category "${row.categoryName}" not found`);
          return { ...row, categoryId: cat.id, categoryName: undefined };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: category, transaction` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    category: {
      fields: [
        { key: "name", label: "Name", type: "string", required: true },
        { key: "type", label: "Type", type: "enum", required: true, enumValues: ["INCOME", "EXPENSE"] },
      ],
      example: { name: "Donations", type: "INCOME" },
    },
    transaction: {
      fields: [
        { key: "amount", label: "Amount", type: "number", required: true },
        { key: "type", label: "Type", type: "enum", required: true, enumValues: ["INCOME", "EXPENSE"] },
        { key: "categoryId", label: "Category ID", type: "uuid", required: false, description: "Either categoryId or categoryName is required" },
        { key: "categoryName", label: "Category Name", type: "string", required: false, description: "Will resolve to categoryId" },
        { key: "description", label: "Description", type: "string", required: false },
        { key: "date", label: "Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      ],
      example: { amount: 5000, type: "INCOME", categoryName: "Donations", description: "Monthly donation", date: "2025-03-15" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
