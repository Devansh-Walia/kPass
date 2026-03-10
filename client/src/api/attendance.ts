import { apiClient } from "./client";

export const attendanceApi = {
  getEmployees: () =>
    apiClient.get("/apps/attendance/employees").then((res) => res.data.data),
  getDailyAttendance: (date: string) =>
    apiClient.get("/apps/attendance/daily", { params: { date } }).then((res) => res.data.data),
  markDailyAttendance: (data: { date: string; records: { employeeId: string; status: string; checkIn?: string; checkOut?: string }[] }) =>
    apiClient.post("/apps/attendance/daily", data).then((res) => res.data.data),
  getLeaves: (status?: string) =>
    apiClient.get("/apps/attendance/leaves", { params: status ? { status } : {} }).then((res) => res.data.data),
  createLeave: (data: { employeeId: string; startDate: string; endDate: string; reason: string }) =>
    apiClient.post("/apps/attendance/leaves", data).then((res) => res.data.data),
  updateLeaveStatus: (id: string, status: string) =>
    apiClient.patch(`/apps/attendance/leaves/${id}`, { status }).then((res) => res.data.data),
  getReport: (month: number, year: number) =>
    apiClient.get("/apps/attendance/report", { params: { month, year } }).then((res) => res.data.data),
};
