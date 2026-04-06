import { apiClient } from "./client";

export const contentCalendarApi = {
  getPosts: (params?: any) =>
    apiClient.get("/apps/content-calendar/posts", { params }).then((res) => res.data.data),
  createPost: (data: any) =>
    apiClient.post("/apps/content-calendar/posts", data).then((res) => res.data.data),
  updatePost: (id: string, data: any) =>
    apiClient.patch(`/apps/content-calendar/posts/${id}`, data).then((res) => res.data.data),
  deletePost: (id: string) =>
    apiClient.delete(`/apps/content-calendar/posts/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/content-calendar/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/content-calendar/import-template", { params: { entity } }).then((res) => res.data.data),
};
