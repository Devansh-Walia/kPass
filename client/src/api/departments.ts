import { apiClient } from "./client";

export const departmentsApi = {
  list: () => apiClient.get("/departments").then(res => res.data.data),
  assignUser: (userId: string, departmentId: string) =>
    apiClient.post(`/departments/users/${userId}`, { departmentId }).then(res => res.data.data),
  removeUser: (userId: string, departmentId: string) =>
    apiClient.delete(`/departments/users/${userId}/${departmentId}`).then(res => res.data.data),
};
