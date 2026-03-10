import { apiClient } from "./client";

export const contentCalendarApi = {
  getPosts: (params?: any) =>
    apiClient.get("/apps/content-calendar/posts", { params }).then((res) => res.data.data),
  createPost: (data: any) =>
    apiClient.post("/apps/content-calendar/posts", data).then((res) => res.data.data),
  updatePost: (id: string, data: any) =>
    apiClient.patch(`/apps/content-calendar/posts/${id}`, data).then((res) => res.data.data),
};
