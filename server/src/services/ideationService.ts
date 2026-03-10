import { prisma } from "../lib/prisma.js";
import type { IdeaStage } from "@prisma/client";

export const ideationService = {
  listIdeas: (stage?: IdeaStage) => {
    const where = stage ? { stage } : {};
    return prisma.idea.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  createIdea: (data: { title: string; description: string }, userId: string) =>
    prisma.idea.create({
      data: { ...data, createdById: userId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    }),

  updateIdea: (id: string, data: { title?: string; description?: string; stage?: IdeaStage }) =>
    prisma.idea.update({
      where: { id },
      data,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    }),

  voteIdea: (id: string) =>
    prisma.idea.update({
      where: { id },
      data: { votes: { increment: 1 } },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    }),
};
