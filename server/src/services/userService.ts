import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { z } from "zod";
import { createUserSchema, updateUserSchema } from "../validators/users.js";

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userService = {
  list: () =>
    prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),

  getById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true,
        apps: { include: { app: true } },
      },
    }),

  create: async (data: CreateUserInput, orgId: string) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already exists");

    const passwordHash = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        orgId,
        mustChangePassword: true,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
  },

  update: (id: string, data: UpdateUserInput) =>
    prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    }),

  softDelete: (id: string) =>
    prisma.user.update({ where: { id }, data: { isActive: false } }),
};
