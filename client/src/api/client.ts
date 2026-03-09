import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

apiClient.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(res => res, async err => {
  const isRefreshRequest = err.config?.url?.includes("/auth/refresh");
  if (err.response?.status === 401 && !err.config._retry && !isRefreshRequest) {
    err.config._retry = true;
    try {
      const res = await apiClient.post("/auth/refresh");
      accessToken = res.data.data.accessToken;
      return apiClient(err.config);
    } catch {
      accessToken = null;
      return Promise.reject(err);
    }
  }
  return Promise.reject(err);
});
