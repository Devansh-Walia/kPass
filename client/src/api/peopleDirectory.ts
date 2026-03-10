import { apiClient } from "./client";

export const peopleDirectoryApi = {
  getEmployees: (department?: string) =>
    apiClient
      .get("/apps/people-directory/employees", { params: department ? { department } : {} })
      .then((res) => res.data.data),
  getEmployee: (id: string) =>
    apiClient.get(`/apps/people-directory/employees/${id}`).then((res) => res.data.data),
  createEmployee: (data: any) =>
    apiClient.post("/apps/people-directory/employees", data).then((res) => res.data.data),
  updateEmployee: (id: string, data: any) =>
    apiClient.patch(`/apps/people-directory/employees/${id}`, data).then((res) => res.data.data),
};
