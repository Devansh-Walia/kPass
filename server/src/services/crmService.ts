import { prisma } from "../lib/prisma.js";

export const crmService = {
  listContacts: () =>
    prisma.contact.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { deals: true, activities: true } } } }),

  getContact: (id: string) =>
    prisma.contact.findUnique({ where: { id }, include: { deals: true, activities: { orderBy: { createdAt: "desc" } } } }),

  createContact: (data: any, userId: string) =>
    prisma.contact.create({ data: { ...data, createdById: userId } }),

  updateContact: (id: string, data: any) =>
    prisma.contact.update({ where: { id }, data }),

  listDeals: () =>
    prisma.deal.findMany({ include: { contact: { select: { name: true } }, owner: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } }),

  createDeal: (data: { title: string; value?: number | null; stage?: any; contactId?: string | null }, userId: string) =>
    prisma.deal.create({ data: { ...data, ownerId: userId } }),

  updateDeal: (id: string, data: any) =>
    prisma.deal.update({ where: { id }, data }),

  listActivities: (contactId?: string) => {
    const where = contactId ? { contactId } : {};
    return prisma.activity.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  createActivity: (data: { contactId?: string | null; type?: any; content: string }, userId: string) =>
    prisma.activity.create({ data: { ...data, createdById: userId } }),

  deleteContact: (id: string) =>
    prisma.contact.delete({ where: { id } }),

  deleteDeal: (id: string) =>
    prisma.deal.delete({ where: { id } }),

  deleteActivity: (id: string) =>
    prisma.activity.delete({ where: { id } }),
};
