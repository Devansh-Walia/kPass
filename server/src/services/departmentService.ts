import { prisma } from "../lib/prisma.js";

export const departmentService = {
  listAll: () =>
    prisma.department.findMany({
      include: { defaultApps: { include: { app: { select: { id: true, name: true, slug: true } } } } },
      orderBy: { name: "asc" },
    }),

  assignUser: async (userId: string, departmentId: string, assignedById: string) => {
    await prisma.userDepartment.create({
      data: { userId, departmentId },
    });

    const deptApps = await prisma.departmentApp.findMany({
      where: { departmentId },
      select: { appId: true },
    });

    if (deptApps.length > 0) {
      await prisma.userApp.createMany({
        data: deptApps.map(da => ({
          userId,
          appId: da.appId,
          assignedById,
          source: "department",
        })),
        skipDuplicates: true,
      });
    }
  },

  removeUser: async (userId: string, departmentId: string) => {
    const deptApps = await prisma.departmentApp.findMany({
      where: { departmentId },
      select: { appId: true },
    });

    if (deptApps.length > 0) {
      await prisma.userApp.deleteMany({
        where: {
          userId,
          appId: { in: deptApps.map(da => da.appId) },
          source: "department",
        },
      });
    }

    await prisma.userDepartment.delete({
      where: { userId_departmentId: { userId, departmentId } },
    });
  },
};
