import { prisma } from "../lib/prisma.js";

export const workshopTrackerService = {
  listWorkshops: () =>
    prisma.workshop.findMany({
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { date: "asc" },
    }),

  createWorkshop: (
    data: {
      title: string;
      description?: string;
      date: Date;
      instructor: string;
      materialsNeeded?: string;
      maxParticipants?: number;
    },
    userId: string
  ) =>
    prisma.workshop.create({
      data: { ...data, createdById: userId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { participants: true } },
      },
    }),

  getWorkshop: (id: string) =>
    prisma.workshop.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        participants: { orderBy: { createdAt: "asc" } },
      },
    }),

  updateWorkshop: (
    id: string,
    data: {
      title?: string;
      description?: string;
      date?: Date;
      instructor?: string;
      materialsNeeded?: string;
      maxParticipants?: number;
    }
  ) =>
    prisma.workshop.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        participants: { orderBy: { createdAt: "asc" } },
      },
    }),

  addParticipant: (workshopId: string, data: { studentName: string; studentId?: string }) =>
    prisma.workshopParticipant.create({
      data: { workshopId, ...data },
    }),

  toggleAttendance: async (participantId: string) => {
    const participant = await prisma.workshopParticipant.findUniqueOrThrow({
      where: { id: participantId },
    });
    return prisma.workshopParticipant.update({
      where: { id: participantId },
      data: { attended: !participant.attended },
    });
  },
};
