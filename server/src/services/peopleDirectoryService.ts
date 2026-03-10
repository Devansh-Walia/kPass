import { prisma } from "../lib/prisma.js";

export const peopleDirectoryService = {
  listEmployees: (department?: string, isActive?: boolean) => {
    const where: any = {};
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  },

  getEmployee: (id: string) =>
    prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),

  createEmployee: (data: any, userId: string) =>
    prisma.employee.create({ data: { ...data, joinDate: new Date(data.joinDate), createdById: userId } }),

  updateEmployee: (id: string, data: any) => {
    if (data.joinDate) data.joinDate = new Date(data.joinDate);
    return prisma.employee.update({ where: { id }, data });
  },
};
