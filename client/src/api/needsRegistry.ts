import { apiClient } from "./client";

export const needsRegistryApi = {
  getRequests: (status?: string) =>
    apiClient
      .get("/apps/needs-registry/requests", { params: status ? { status } : {} })
      .then((res) => res.data.data),
  createRequest: (data: any) =>
    apiClient.post("/apps/needs-registry/requests", data).then((res) => res.data.data),
  updateStatus: (id: string, data: any) =>
    apiClient.patch(`/apps/needs-registry/requests/${id}`, data).then((res) => res.data.data),
};
