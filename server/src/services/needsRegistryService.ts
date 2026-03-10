import { prisma } from "../lib/prisma.js";
import { NeedStatus } from "@prisma/client";

export const needsRegistryService = {
  listRequests: (status?: string) => {
    const where: any = {};
    if (status) where.status = status;
    return prisma.needRequest.findMany({
      where,
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  createRequest: (data: { childName: string; category: any; description: string }, userId: string) =>
    prisma.needRequest.create({
      data: { ...data, requestedById: userId },
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
      },
    }),

  updateRequest: (id: string, data: { childName?: string; category?: any; description?: string }) =>
    prisma.needRequest.update({
      where: { id },
      data,
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    }),

  deleteRequest: (id: string) =>
    prisma.needRequest.delete({ where: { id } }),

  updateStatus: (id: string, data: { status: string; approvedById?: string }) => {
    const updateData: any = { status: data.status };
    if (data.status === NeedStatus.APPROVED && data.approvedById) {
      updateData.approvedById = data.approvedById;
    }
    if (data.status === NeedStatus.FULFILLED) {
      updateData.fulfilledAt = new Date();
    }
    return prisma.needRequest.update({
      where: { id },
      data: updateData,
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });
  },
};
