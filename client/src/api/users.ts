import { apiClient } from "./client";

export const usersApi = {
  list: () => apiClient.get("/users").then(res => res.data.data),
  getById: (id: string) => apiClient.get(`/users/${id}`).then(res => res.data.data),
  create: (data: any) => apiClient.post("/users", data).then(res => res.data.data),
  update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data).then(res => res.data.data),
  deactivate: (id: string) => apiClient.delete(`/users/${id}`).then(res => res.data.data),
  assignApps: (userId: string, appIds: string[]) => apiClient.post(`/users/${userId}/apps`, { appIds }),
  revokeApp: (userId: string, appId: string) => apiClient.delete(`/users/${userId}/apps/${appId}`),
};
