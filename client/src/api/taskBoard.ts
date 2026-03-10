import { apiClient } from "./client";

export const taskBoardApi = {
  getBoards: () =>
    apiClient.get("/apps/task-board/boards").then((res) => res.data.data),
  createBoard: (data: any) =>
    apiClient.post("/apps/task-board/boards", data).then((res) => res.data.data),
  getBoard: (id: string) =>
    apiClient.get(`/apps/task-board/boards/${id}`).then((res) => res.data.data),
  createTask: (boardId: string, data: any) =>
    apiClient.post(`/apps/task-board/boards/${boardId}/tasks`, data).then((res) => res.data.data),
  updateTask: (id: string, data: any) =>
    apiClient.patch(`/apps/task-board/tasks/${id}`, data).then((res) => res.data.data),
  deleteTask: (id: string) =>
    apiClient.delete(`/apps/task-board/tasks/${id}`).then((res) => res.data.data),
};
