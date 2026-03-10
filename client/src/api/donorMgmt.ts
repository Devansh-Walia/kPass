import { apiClient } from "./client";

export const donorMgmtApi = {
  getDonors: (params?: any) =>
    apiClient.get("/apps/donor-mgmt/donors", { params }).then((res) => res.data.data),
  getDonor: (id: string) =>
    apiClient.get(`/apps/donor-mgmt/donors/${id}`).then((res) => res.data.data),
  createDonor: (data: any) =>
    apiClient.post("/apps/donor-mgmt/donors", data).then((res) => res.data.data),
  updateDonor: (id: string, data: any) =>
    apiClient.patch(`/apps/donor-mgmt/donors/${id}`, data).then((res) => res.data.data),
  getDonations: () =>
    apiClient.get("/apps/donor-mgmt/donations").then((res) => res.data.data),
  createDonation: (data: any) =>
    apiClient.post("/apps/donor-mgmt/donations", data).then((res) => res.data.data),
  deleteDonor: (id: string) =>
    apiClient.delete(`/apps/donor-mgmt/donors/${id}`).then((res) => res.data.data),
  deleteDonation: (id: string) =>
    apiClient.delete(`/apps/donor-mgmt/donations/${id}`).then((res) => res.data.data),
};
