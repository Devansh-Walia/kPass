import { prisma } from "../lib/prisma.js";

export const contentCalendarService = {
  listPosts: (filters?: { platform?: string; status?: string; month?: number; year?: number }) => {
    const where: any = {};
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.status) where.status = filters.status;
    if (filters?.month && filters?.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      where.scheduledDate = { gte: start, lte: end };
    }
    return prisma.contentPost.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledDate: "asc" },
    });
  },

  createPost: (data: { title: string; content?: string; platform: any; scheduledDate: Date; status?: any }, userId: string) =>
    prisma.contentPost.create({
      data: { ...data, createdById: userId },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    }),

  updatePost: (id: string, data: any) =>
    prisma.contentPost.update({
      where: { id },
      data,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    }),

  deletePost: (id: string) =>
    prisma.contentPost.delete({ where: { id } }),
};
