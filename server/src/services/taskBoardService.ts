import { prisma } from "../lib/prisma.js";

export const taskBoardService = {
  listBoards: () => prisma.board.findMany({ orderBy: { createdAt: "desc" } }),

  createBoard: (data: { name: string; description?: string }, userId: string) =>
    prisma.board.create({ data: { ...data, createdById: userId } }),

  getBoard: (id: string) =>
    prisma.board.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { assignee: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),

  createTask: (data: { title: string; description?: string; priority?: "LOW" | "MEDIUM" | "HIGH"; dueDate?: Date; assigneeId?: string }, boardId: string, userId: string) =>
    prisma.taskCard.create({
      data: { ...data, boardId, createdById: userId },
      include: { assignee: { select: { firstName: true, lastName: true } } },
    }),

  updateTask: (id: string, data: { title?: string; description?: string; status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"; priority?: "LOW" | "MEDIUM" | "HIGH"; dueDate?: Date; assigneeId?: string | null }) =>
    prisma.taskCard.update({
      where: { id },
      data,
      include: { assignee: { select: { firstName: true, lastName: true } } },
    }),

  deleteTask: (id: string) => prisma.taskCard.delete({ where: { id } }),
};
