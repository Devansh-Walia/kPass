import { apiClient } from "./client";

export const financeApi = {
  getCategories: () =>
    apiClient.get("/apps/finance/categories").then((res) => res.data.data),
  createCategory: (data: any) =>
    apiClient.post("/apps/finance/categories", data).then((res) => res.data.data),
  getTransactions: (params?: any) =>
    apiClient.get("/apps/finance/transactions", { params }).then((res) => res.data.data),
  createTransaction: (data: any) =>
    apiClient.post("/apps/finance/transactions", data).then((res) => res.data.data),
  updateTransaction: (id: string, data: any) =>
    apiClient.patch(`/apps/finance/transactions/${id}`, data).then((res) => res.data.data),
  deleteTransaction: (id: string) =>
    apiClient.delete(`/apps/finance/transactions/${id}`).then((res) => res.data.data),
  deleteCategory: (id: string) =>
    apiClient.delete(`/apps/finance/categories/${id}`).then((res) => res.data.data),
  getReport: (startDate: string, endDate: string) =>
    apiClient
      .get("/apps/finance/reports", { params: { startDate, endDate } })
      .then((res) => res.data.data),
};
