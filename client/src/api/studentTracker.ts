import { apiClient } from "./client";

export const studentTrackerApi = {
  getStudents: (params?: any) =>
    apiClient.get("/apps/student-tracker/students", { params }).then((res) => res.data.data),
  getStudent: (id: string) =>
    apiClient.get(`/apps/student-tracker/students/${id}`).then((res) => res.data.data),
  createStudent: (data: any) =>
    apiClient.post("/apps/student-tracker/students", data).then((res) => res.data.data),
  updateStudent: (id: string, data: any) =>
    apiClient.patch(`/apps/student-tracker/students/${id}`, data).then((res) => res.data.data),
  markAttendance: (data: { date: string; records: { studentId: string; status: string }[] }) =>
    apiClient.post("/apps/student-tracker/attendance", data).then((res) => res.data.data),
  getAttendance: (params?: any) =>
    apiClient.get("/apps/student-tracker/attendance", { params }).then((res) => res.data.data),
  deleteStudent: (id: string) =>
    apiClient.delete(`/apps/student-tracker/students/${id}`).then((res) => res.data.data),
  getReport: (batch: string, startDate: string, endDate: string) =>
    apiClient.get("/apps/student-tracker/report", { params: { batch, startDate, endDate } }).then((res) => res.data.data),
};
