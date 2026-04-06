import { apiClient } from "./client";

export const ideationApi = {
  getIdeas: (stage?: string) =>
    apiClient
      .get("/apps/ideation/ideas", { params: stage ? { stage } : {} })
      .then((res) => res.data.data),
  createIdea: (data: { title: string; description: string }) =>
    apiClient.post("/apps/ideation/ideas", data).then((res) => res.data.data),
  updateIdea: (id: string, data: any) =>
    apiClient.patch(`/apps/ideation/ideas/${id}`, data).then((res) => res.data.data),
  voteIdea: (id: string) =>
    apiClient.post(`/apps/ideation/ideas/${id}/vote`).then((res) => res.data.data),
  deleteIdea: (id: string) =>
    apiClient.delete(`/apps/ideation/ideas/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/ideation/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/ideation/import-template", { params: { entity } }).then((res) => res.data.data),
};
