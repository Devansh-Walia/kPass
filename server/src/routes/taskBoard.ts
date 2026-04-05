import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { taskBoardService } from "../services/taskBoardService.js";
import { createBoardSchema, createTaskSchema, updateTaskSchema } from "../validators/taskBoard.js";
import { bulkImportRequestSchema } from "../validators/bulkImport.js";
import { processBulkImport } from "../services/bulkImportService.js";
import { prisma } from "../lib/prisma.js";

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

// Bulk import
router.post("/bulk-import", async (req, res) => {
  const { entity, rows } = bulkImportRequestSchema.parse(req.body);

  if (entity === "board") {
    const result = await processBulkImport({
      rows,
      schema: createBoardSchema,
      createFn: (data, userId) => taskBoardService.createBoard(data, userId),
      userId: req.user!.id,
    });
    return res.json({ data: result });
  }

  if (entity === "task") {
    const result = await processBulkImport({
      rows,
      schema: createTaskSchema,
      createFn: (data, userId) => {
        if (!data._boardId) throw new Error("boardId or boardName is required for tasks");
        const boardId = data._boardId;
        delete data._boardId;
        return taskBoardService.createTask(data, boardId, userId);
      },
      userId: req.user!.id,
      resolveFn: async (row) => {
        // Resolve boardName → boardId
        if (row.boardName && !row.boardId) {
          const board = await prisma.board.findFirst({
            where: { name: { equals: row.boardName as string, mode: "insensitive" } },
          });
          if (!board) throw new Error(`Board "${row.boardName}" not found`);
          return { ...row, _boardId: board.id, boardName: undefined };
        }
        if (row.boardId) {
          return { ...row, _boardId: row.boardId, boardId: undefined };
        }
        return row;
      },
    });
    return res.json({ data: result });
  }

  res.status(400).json({ error: `Unknown entity: ${entity}. Supported: board, task` });
});

router.get("/import-template", (req, res) => {
  const entity = req.query.entity as string;
  const templates: Record<string, any> = {
    board: {
      fields: [
        { key: "name", label: "Name", type: "string", required: true },
        { key: "description", label: "Description", type: "string", required: false },
      ],
      example: { name: "Sprint 1", description: "First sprint tasks" },
    },
    task: {
      fields: [
        { key: "title", label: "Title", type: "string", required: true },
        { key: "description", label: "Description", type: "string", required: false },
        { key: "priority", label: "Priority", type: "enum", required: false, enumValues: ["LOW", "MEDIUM", "HIGH"], description: "Defaults to MEDIUM" },
        { key: "dueDate", label: "Due Date", type: "date", required: false, description: "YYYY-MM-DD format" },
        { key: "boardId", label: "Board ID", type: "uuid", required: false, description: "Either boardId or boardName" },
        { key: "boardName", label: "Board Name", type: "string", required: false, description: "Will resolve to boardId" },
      ],
      example: { title: "Design landing page", priority: "HIGH", dueDate: "2025-04-01", boardName: "Sprint 1" },
    },
  };
  if (!entity || !templates[entity]) {
    return res.status(400).json({ error: `Unknown entity. Supported: ${Object.keys(templates).join(", ")}` });
  }
  res.json({ data: templates[entity] });
});

export default router;
