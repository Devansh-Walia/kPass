import { apiClient } from "./client";

export const needsRegistryApi = {
  getRequests: (status?: string) =>
    apiClient
      .get("/apps/needs-registry/requests", { params: status ? { status } : {} })
      .then((res) => res.data.data),
  createRequest: (data: any) =>
    apiClient.post("/apps/needs-registry/requests", data).then((res) => res.data.data),
  updateRequest: (id: string, data: any) =>
    apiClient.put(`/apps/needs-registry/requests/${id}`, data).then((res) => res.data.data),
  updateStatus: (id: string, data: any) =>
    apiClient.patch(`/apps/needs-registry/requests/${id}`, data).then((res) => res.data.data),
  deleteRequest: (id: string) =>
    apiClient.delete(`/apps/needs-registry/requests/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/needs-registry/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/needs-registry/import-template", { params: { entity } }).then((res) => res.data.data),
};
