import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { peopleDirectoryService } from "../services/peopleDirectoryService.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validators/peopleDirectory.js";

const router = Router();
router.use(authenticate, requireAppAccess("people-directory"));

router.get("/employees", async (req, res) => {
  const department = req.query.department as string | undefined;
  const isActiveParam = req.query.isActive as string | undefined;
  const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
  const employees = await peopleDirectoryService.listEmployees(department, isActive);
  res.json({ data: employees });
});

router.get("/employees/:id", async (req, res) => {
  const employee = await peopleDirectoryService.getEmployee(req.params.id as string);
  if (!employee) return res.status(404).json({ error: "Employee not found" });
  res.json({ data: employee });
});

router.post("/employees", async (req, res) => {
  const body = createEmployeeSchema.parse(req.body);
  const employee = await peopleDirectoryService.createEmployee(body, req.user!.id);
  res.status(201).json({ data: employee });
});

router.patch("/employees/:id", async (req, res) => {
  const body = updateEmployeeSchema.parse(req.body);
  const employee = await peopleDirectoryService.updateEmployee(req.params.id as string, body);
  res.json({ data: employee });
});

router.delete("/employees/:id", requireAdmin, async (req, res) => {
  await peopleDirectoryService.deleteEmployee(req.params.id as string);
  res.json({ data: { success: true } });
});

export default router;
