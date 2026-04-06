import { apiClient } from "./client";

export const workshopTrackerApi = {
  getWorkshops: () =>
    apiClient.get("/apps/workshop-tracker/workshops").then((res) => res.data.data),
  createWorkshop: (data: any) =>
    apiClient.post("/apps/workshop-tracker/workshops", data).then((res) => res.data.data),
  getWorkshop: (id: string) =>
    apiClient.get(`/apps/workshop-tracker/workshops/${id}`).then((res) => res.data.data),
  updateWorkshop: (id: string, data: any) =>
    apiClient.patch(`/apps/workshop-tracker/workshops/${id}`, data).then((res) => res.data.data),
  addParticipant: (workshopId: string, data: any) =>
    apiClient
      .post(`/apps/workshop-tracker/workshops/${workshopId}/participants`, data)
      .then((res) => res.data.data),
  toggleAttendance: (participantId: string) =>
    apiClient
      .patch(`/apps/workshop-tracker/participants/${participantId}/attendance`)
      .then((res) => res.data.data),
  deleteWorkshop: (id: string) =>
    apiClient.delete(`/apps/workshop-tracker/workshops/${id}`).then((res) => res.data.data),
  removeParticipant: (id: string) =>
    apiClient.delete(`/apps/workshop-tracker/participants/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/workshop-tracker/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/workshop-tracker/import-template", { params: { entity } }).then((res) => res.data.data),
};
