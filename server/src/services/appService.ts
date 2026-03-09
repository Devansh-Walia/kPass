import { prisma } from "../lib/prisma.js";

export const appService = {
  listAll: () => prisma.app.findMany({ orderBy: { name: "asc" } }),

  listForUser: (userId: string) =>
    prisma.userApp.findMany({
      where: { userId },
      include: { app: true },
    }).then(uas => uas.map(ua => ua.app)),

  create: (data: { name: string; slug: string; description?: string; icon?: string; type: any; route: string }) =>
    prisma.app.create({ data }),

  update: (id: string, data: Partial<{ name: string; description: string; icon: string; isActive: boolean }>) =>
    prisma.app.update({ where: { id }, data }),
};
