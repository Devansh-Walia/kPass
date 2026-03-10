import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { departmentService } from "../services/departmentService.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/", async (_req, res) => {
  const departments = await departmentService.listAll();
  res.json({ data: departments });
});

router.post("/users/:id", async (req, res) => {
  const { departmentId } = req.body;
  await departmentService.assignUser(req.params.id, departmentId, req.user!.id);
  res.status(201).json({ data: { message: "Department assigned" } });
});

router.delete("/users/:id/:deptId", async (req, res) => {
  await departmentService.removeUser(req.params.id, req.params.deptId);
  res.json({ data: { message: "Department removed" } });
});

export default router;
