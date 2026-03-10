import { prisma } from "../lib/prisma.js";
import { DonorType } from "@prisma/client";

export const donorMgmtService = {
  listDonors: (filters?: { type?: DonorType; search?: string }) => {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.search) where.name = { contains: filters.search, mode: "insensitive" };
    return prisma.donor.findMany({
      where,
      include: { _count: { select: { donations: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  getDonor: async (id: string) => {
    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        donations: { orderBy: { date: "desc" } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!donor) return null;
    const totalDonated = donor.donations.reduce((sum, d) => sum + d.amount, 0);
    return { ...donor, totalDonated };
  },

  createDonor: (data: { name: string; email?: string; phone?: string; type: DonorType; notes?: string }, userId: string) =>
    prisma.donor.create({ data: { ...data, createdById: userId } }),

  updateDonor: (id: string, data: any) =>
    prisma.donor.update({ where: { id }, data }),

  listDonations: () =>
    prisma.donation.findMany({
      include: {
        donor: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
    }),

  createDonation: (data: { donorId: string; amount: number; date: Date; purpose?: string; receiptNo?: string }, userId: string) =>
    prisma.donation.create({
      data: { ...data, createdById: userId },
      include: { donor: { select: { name: true } } },
    }),

  deleteDonor: (id: string) =>
    prisma.donor.delete({ where: { id } }),

  deleteDonation: (id: string) =>
    prisma.donation.delete({ where: { id } }),
};
