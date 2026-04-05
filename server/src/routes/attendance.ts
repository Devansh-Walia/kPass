import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { attendanceService } from "../services/attendanceService.js";
import { markStaffAttendanceSchema, createLeaveSchema, updateLeaveStatusSchema } from "../validators/attendance.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";
import { prisma } from "../lib/prisma.js";
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

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "leave") {
    const result = await processBulkImport({
      rows,
      schema: createLeaveSchema,
      createFn: (data) => attendanceService.createLeave(data),
      userId: req.user!.id,
      resolveFn: async (row) => {
        if (row.employeeName && !row.employeeId) {
          const emp = await prisma.employee.findFirst({
            where: { name: { equals: row.employeeName as string, mode: "insensitive" }, isActive: true },
          });
          if (!emp) throw new Error(`Employee "${row.employeeName}" not found`);
          return { ...row, employeeId: emp.id, employeeName: undefined };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: leave` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    leave: {
      fields: [
        { key: "employeeId", label: "Employee ID", type: "uuid", required: false, description: "Either employeeId or employeeName" },
        { key: "employeeName", label: "Employee Name", type: "string", required: false, description: "Will resolve to employeeId" },
        { key: "startDate", label: "Start Date", type: "date", required: true, description: "YYYY-MM-DD format" },
        { key: "endDate", label: "End Date", type: "date", required: true, description: "YYYY-MM-DD format" },
        { key: "reason", label: "Reason", type: "string", required: true },
      ],
      example: { employeeName: "Priya Singh", startDate: "2025-03-20", endDate: "2025-03-22", reason: "Family function" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
