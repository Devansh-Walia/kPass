import { prisma } from "../lib/prisma.js";

export const attendanceService = {
  listEmployees: () =>
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, department: true, designation: true },
    }),

  listDailyAttendance: (date: Date) =>
    prisma.staffAttendance.findMany({
      where: { date },
      include: { employee: { select: { id: true, name: true, department: true } } },
      orderBy: { employee: { name: "asc" } },
    }),

  markAttendance: async (
    date: Date,
    records: { employeeId: string; status: "PRESENT" | "ABSENT" | "LEAVE"; checkIn?: Date; checkOut?: Date }[],
    markedById: string
  ) => {
    const upserts = records.map((r) =>
      prisma.staffAttendance.upsert({
        where: { employeeId_date: { employeeId: r.employeeId, date } },
        update: { status: r.status, checkIn: r.checkIn ?? null, checkOut: r.checkOut ?? null },
        create: { employeeId: r.employeeId, date, status: r.status, checkIn: r.checkIn, checkOut: r.checkOut, markedById },
      })
    );
    return prisma.$transaction(upserts);
  },

  listLeaves: (status?: "PENDING" | "APPROVED" | "REJECTED") => {
    const where: any = {};
    if (status) where.status = status;
    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, department: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  createLeave: (data: { employeeId: string; startDate: Date; endDate: Date; reason: string }) =>
    prisma.leaveRequest.create({
      data,
      include: { employee: { select: { id: true, name: true } } },
    }),

  updateLeaveStatus: (id: string, status: "APPROVED" | "REJECTED", reviewedById: string) =>
    prisma.leaveRequest.update({
      where: { id },
      data: { status, reviewedById },
      include: {
        employee: { select: { id: true, name: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    }),

  getMonthlyReport: async (month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    });

    const attendance = await prisma.staffAttendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    const report = employees.map((emp: any) => {
      const records = attendance.filter((a: any) => a.employeeId === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        present: records.filter((r: any) => r.status === "PRESENT").length,
        absent: records.filter((r: any) => r.status === "ABSENT").length,
        leave: records.filter((r: any) => r.status === "LEAVE").length,
        totalMarked: records.length,
      };
    });

    return { month, year, totalDays: endDate.getDate(), report };
  },
};
