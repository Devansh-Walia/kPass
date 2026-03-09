import { apiClient } from "./client";

export const appsApi = {
  list: () => apiClient.get("/apps").then(res => res.data.data),
};
