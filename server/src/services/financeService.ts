import { prisma } from "../lib/prisma.js";
import { TransactionType } from "@prisma/client";

export const financeService = {
  listCategories: () => prisma.financeCategory.findMany({ orderBy: { name: "asc" } }),

  createCategory: (data: { name: string; type: TransactionType }) =>
    prisma.financeCategory.create({ data }),

  listTransactions: (filters?: { startDate?: Date; endDate?: Date; type?: TransactionType; categoryId?: string }) => {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.type) where.type = filters.type;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    return prisma.transaction.findMany({
      where,
      include: { category: true, createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
    });
  },

  createTransaction: (data: { amount: number; type: TransactionType; categoryId: string; description?: string; date: Date }, userId: string) =>
    prisma.transaction.create({
      data: { ...data, createdById: userId },
      include: { category: true },
    }),

  getReport: async (startDate: Date, endDate: Date) => {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, profit: income - expense, transactionCount: transactions.length };
  },
};
