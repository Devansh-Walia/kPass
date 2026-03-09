import { apiClient, setAccessToken } from "./client";

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },
  refresh: async () => {
    const res = await apiClient.post("/auth/refresh");
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },
  logout: async () => {
    await apiClient.post("/auth/logout");
    setAccessToken(null);
  },
};
