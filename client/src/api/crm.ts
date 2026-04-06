import { apiClient } from "./client";

export const crmApi = {
  getContacts: () =>
    apiClient.get("/apps/crm/contacts").then((res) => res.data.data),
  getContact: (id: string) =>
    apiClient.get(`/apps/crm/contacts/${id}`).then((res) => res.data.data),
  createContact: (data: any) =>
    apiClient.post("/apps/crm/contacts", data).then((res) => res.data.data),
  updateContact: (id: string, data: any) =>
    apiClient.patch(`/apps/crm/contacts/${id}`, data).then((res) => res.data.data),
  getDeals: () =>
    apiClient.get("/apps/crm/deals").then((res) => res.data.data),
  createDeal: (data: any) =>
    apiClient.post("/apps/crm/deals", data).then((res) => res.data.data),
  updateDeal: (id: string, data: any) =>
    apiClient.patch(`/apps/crm/deals/${id}`, data).then((res) => res.data.data),
  getActivities: (contactId?: string) =>
    apiClient
      .get("/apps/crm/activities", { params: contactId ? { contactId } : {} })
      .then((res) => res.data.data),
  createActivity: (data: any) =>
    apiClient.post("/apps/crm/activities", data).then((res) => res.data.data),
  deleteContact: (id: string) =>
    apiClient.delete(`/apps/crm/contacts/${id}`).then((res) => res.data.data),
  deleteDeal: (id: string) =>
    apiClient.delete(`/apps/crm/deals/${id}`).then((res) => res.data.data),
  deleteActivity: (id: string) =>
    apiClient.delete(`/apps/crm/activities/${id}`).then((res) => res.data.data),
  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    apiClient.post("/apps/crm/bulk-import", { entity, rows }).then((res) => res.data.data),
  getImportTemplate: (entity: string) =>
    apiClient.get("/apps/crm/import-template", { params: { entity } }).then((res) => res.data.data),
};
