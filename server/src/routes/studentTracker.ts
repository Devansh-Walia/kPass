import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { studentTrackerService } from "../services/studentTrackerService.js";
import { createStudentSchema, updateStudentSchema, markAttendanceSchema } from "../validators/studentTracker.js";

const router = Router();
router.use(authenticate, requireAppAccess("student-tracker"));

// Students
router.get("/students", async (req, res) => {
  const { batch, isActive } = req.query;
  const students = await studentTrackerService.listStudents({
    batch: batch as string | undefined,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  res.json({ data: students });
});

router.post("/students", async (req, res) => {
  const body = createStudentSchema.parse(req.body);
  const student = await studentTrackerService.createStudent(body, req.user!.id);
  res.status(201).json({ data: student });
});

router.get("/students/:id", async (req, res) => {
  const student = await studentTrackerService.getStudent(req.params.id as string);
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json({ data: student });
});

router.patch("/students/:id", async (req, res) => {
  const body = updateStudentSchema.parse(req.body);
  const student = await studentTrackerService.updateStudent(req.params.id as string, body);
  res.json({ data: student });
});

router.delete("/students/:id", async (req, res) => {
  await studentTrackerService.deleteStudent(req.params.id as string);
  res.json({ data: { message: "Student deleted successfully" } });
});

// Report
router.get("/report", async (req, res) => {
  const { batch, startDate, endDate } = req.query;
  if (!batch || !startDate || !endDate) {
    return res.status(400).json({ error: "batch, startDate, and endDate are required" });
  }
  const report = await studentTrackerService.getAttendanceReport(
    batch as string,
    new Date(startDate as string),
    new Date(endDate as string)
  );
  res.json({ data: report });
});

// Attendance
router.post("/attendance", async (req, res) => {
  const { date, records } = markAttendanceSchema.parse(req.body);
  const attendance = await studentTrackerService.markAttendance(date, records, req.user!.id);
  res.status(201).json({ data: attendance });
});

router.get("/attendance", async (req, res) => {
  const { batch, date } = req.query;
  const attendance = await studentTrackerService.getAttendance({
    batch: batch as string | undefined,
    date: date ? new Date(date as string) : undefined,
  });
  res.json({ data: attendance });
});

export default router;
