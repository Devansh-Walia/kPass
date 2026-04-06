import { apiClient } from "./client";

export const eventManagerApi = {
  getEvents: (params?: any) =>
    apiClient.get("/apps/event-manager/events", { params }).then((res) => res.data.data),
  getEvent: (id: string) =>
    apiClient.get(`/apps/event-manager/events/${id}`).then((res) => res.data.data),
  createEvent: (data: any) =>
    apiClient.post("/apps/event-manager/events", data).then((res) => res.data.data),
  updateEvent: (id: string, data: any) =>
    apiClient.patch(`/apps/event-manager/events/${id}`, data).then((res) => res.data.data),
  addVolunteer: (eventId: string, data: any) =>
    apiClient.post(`/apps/event-manager/events/${eventId}/volunteers`, data).then((res) => res.data.data),
  removeVolunteer: (eventId: string, userId: string) =>
    apiClient.delete(`/apps/event-manager/events/${eventId}/volunteers/${userId}`).then((res) => res.data.data),
  deleteEvent: (id: string) =>
    apiClient.delete(`/apps/event-manager/events/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/event-manager/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/event-manager/import-template", { params: { entity } }).then((res) => res.data.data),
};
