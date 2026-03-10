import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { taskBoardService } from "../services/taskBoardService.js";
import { createBoardSchema, createTaskSchema, updateTaskSchema } from "../validators/taskBoard.js";

const router = Router();
router.use(authenticate, requireAppAccess("task-board"));

router.get("/boards", async (_req, res) => {
  const boards = await taskBoardService.listBoards();
  res.json({ data: boards });
});

router.post("/boards", async (req, res) => {
  const body = createBoardSchema.parse(req.body);
  const board = await taskBoardService.createBoard(body, req.user!.id);
  res.status(201).json({ data: board });
});

router.get("/boards/:id", async (req, res) => {
  const board = await taskBoardService.getBoard(req.params.id as string);
  if (!board) return res.status(404).json({ error: "Board not found" });
  res.json({ data: board });
});

router.post("/boards/:boardId/tasks", async (req, res) => {
  const body = createTaskSchema.parse(req.body);
  const task = await taskBoardService.createTask(body, req.params.boardId as string, req.user!.id);
  res.status(201).json({ data: task });
});

router.patch("/tasks/:id", async (req, res) => {
  const body = updateTaskSchema.parse(req.body);
  const task = await taskBoardService.updateTask(req.params.id as string, body);
  res.json({ data: task });
});

router.delete("/tasks/:id", async (req, res) => {
  await taskBoardService.deleteTask(req.params.id as string);
  res.json({ data: { success: true } });
});

router.delete("/boards/:id", async (req, res) => {
  await taskBoardService.deleteBoard(req.params.id as string);
  res.json({ data: { message: "Board deleted" } });
});

export default router;
