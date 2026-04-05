import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { peopleDirectoryService } from "../services/peopleDirectoryService.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validators/peopleDirectory.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";

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

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "employee") {
    const result = await processBulkImport({
      rows,
      schema: createEmployeeSchema,
      createFn: (data, userId) => peopleDirectoryService.createEmployee(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: employee` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    employee: {
      fields: [
        { key: "name", label: "Name", type: "string", required: true },
        { key: "email", label: "Email", type: "email", required: false },
        { key: "phone", label: "Phone", type: "string", required: false },
        { key: "department", label: "Department", type: "string", required: true },
        { key: "designation", label: "Designation", type: "string", required: true },
        { key: "joinDate", label: "Join Date", type: "date", required: true, description: "YYYY-MM-DD format" },
      ],
      example: { name: "Priya Singh", email: "priya@koshish.org", phone: "9876543210", department: "COE", designation: "Teacher", joinDate: "2025-01-15" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
