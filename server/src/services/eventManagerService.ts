import { prisma } from "../lib/prisma.js";

export const eventManagerService = {
  listEvents: (status?: string) => {
    const where: any = {};
    if (status) where.status = status;
    return prisma.event.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { volunteers: true } },
      },
      orderBy: { date: "desc" },
    });
  },

  createEvent: (data: { title: string; description?: string; date: Date; location?: string; budget?: number }, userId: string) =>
    prisma.event.create({
      data: { ...data, createdById: userId },
    }),

  getEvent: (id: string) =>
    prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        volunteers: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),

  updateEvent: (id: string, data: any) =>
    prisma.event.update({ where: { id }, data }),

  addVolunteer: (eventId: string, data: { userId: string; role?: string }) =>
    prisma.eventVolunteer.create({
      data: { eventId, ...data },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    }),

  removeVolunteer: (eventId: string, userId: string) =>
    prisma.eventVolunteer.delete({
      where: { eventId_userId: { eventId, userId } },
    }),
};
