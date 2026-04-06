import { apiClient } from "./client";

export const peopleDirectoryApi = {
  getEmployees: (department?: string) =>
    apiClient
      .get("/apps/people-directory/employees", { params: department ? { department } : {} })
      .then((res) => res.data.data),
  getEmployee: (id: string) =>
    apiClient.get(`/apps/people-directory/employees/${id}`).then((res) => res.data.data),
  createEmployee: (data: any) =>
    apiClient.post("/apps/people-directory/employees", data).then((res) => res.data.data),
  updateEmployee: (id: string, data: any) =>
    apiClient.patch(`/apps/people-directory/employees/${id}`, data).then((res) => res.data.data),
  deleteEmployee: (id: string) =>
    apiClient.delete(`/apps/people-directory/employees/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/people-directory/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/people-directory/import-template", { params: { entity } }).then((res) => res.data.data),
};
