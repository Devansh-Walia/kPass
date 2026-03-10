import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { attendanceService } from "../services/attendanceService.js";
import { markStaffAttendanceSchema, createLeaveSchema, updateLeaveStatusSchema } from "../validators/attendance.js";
import type { LeaveStatus } from "@prisma/client";

const router = Router();
router.use(authenticate, requireAppAccess("attendance"));

// Employees list (for attendance marking UI)
router.get("/employees", async (_req, res) => {
  const employees = await attendanceService.listEmployees();
  res.json({ data: employees });
});

// Daily attendance
router.get("/daily", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "date query parameter is required" });
  const records = await attendanceService.listDailyAttendance(new Date(date as string));
  res.json({ data: records });
});

router.post("/daily", async (req, res) => {
  const body = markStaffAttendanceSchema.parse(req.body);
  const records = await attendanceService.markAttendance(body.date, body.records, req.user!.id);
  res.status(201).json({ data: records });
});

// Leave requests
router.get("/leaves", async (req, res) => {
  const { status } = req.query;
  const leaves = await attendanceService.listLeaves(status as LeaveStatus | undefined);
  res.json({ data: leaves });
});

router.post("/leaves", async (req, res) => {
  const body = createLeaveSchema.parse(req.body);
  const leave = await attendanceService.createLeave(body);
  res.status(201).json({ data: leave });
});

router.patch("/leaves/:id", async (req, res) => {
  const body = updateLeaveStatusSchema.parse(req.body);
  const leave = await attendanceService.updateLeaveStatus(req.params.id as string, body.status, req.user!.id);
  res.json({ data: leave });
});

// Monthly report
router.get("/report", async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: "month and year are required" });
  const report = await attendanceService.getMonthlyReport(Number(month), Number(year));
  res.json({ data: report });
});

export default router;
