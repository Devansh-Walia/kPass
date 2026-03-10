import { prisma } from "../lib/prisma.js";
import { AttendanceStatus } from "@prisma/client";

export const studentTrackerService = {
  listStudents: (filters?: { batch?: string; isActive?: boolean }) => {
    const where: any = {};
    if (filters?.batch) where.batch = filters.batch;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    return prisma.student.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  createStudent: (data: { name: string; age: number; guardianName: string; guardianPhone?: string; batch: string }, userId: string) =>
    prisma.student.create({
      data: { ...data, enrollmentDate: new Date(), createdById: userId },
    }),

  getStudent: (id: string) =>
    prisma.student.findUnique({
      where: { id },
      include: {
        attendance: { orderBy: { date: "desc" }, include: { markedBy: { select: { firstName: true, lastName: true } } } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    }),

  updateStudent: (id: string, data: any) =>
    prisma.student.update({ where: { id }, data }),

  deleteStudent: (id: string) =>
    prisma.student.delete({ where: { id } }),

  markAttendance: async (date: Date, records: { studentId: string; status: AttendanceStatus }[], userId: string) => {
    const results = await Promise.all(
      records.map((r) =>
        prisma.studentAttendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date } },
          update: { status: r.status, markedById: userId },
          create: { studentId: r.studentId, date, status: r.status, markedById: userId },
        })
      )
    );
    return results;
  },

  getAttendance: (filters: { batch?: string; date?: Date }) => {
    const where: any = {};
    if (filters.date) where.date = filters.date;
    if (filters.batch) where.student = { batch: filters.batch };
    return prisma.studentAttendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, batch: true } },
        markedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
    });
  },

  getAttendanceReport: async (batch: string, startDate: Date, endDate: Date) => {
    const records = await prisma.studentAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        student: { batch },
      },
      include: { student: { select: { id: true, name: true } } },
    });

    // Aggregate per-student stats
    const studentMap: Record<string, { name: string; total: number; present: number; absent: number; late: number }> = {};
    for (const r of records) {
      const sid = r.student.id;
      if (!studentMap[sid]) {
        studentMap[sid] = { name: r.student.name, total: 0, present: 0, absent: 0, late: 0 };
      }
      studentMap[sid].total++;
      if (r.status === AttendanceStatus.PRESENT) studentMap[sid].present++;
      else if (r.status === AttendanceStatus.ABSENT) studentMap[sid].absent++;
      else if (r.status === AttendanceStatus.LATE) studentMap[sid].late++;
    }

    const students = Object.entries(studentMap).map(([id, stats]) => ({
      id,
      ...stats,
      attendancePercent: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0,
    }));

    const total = records.length;
    const present = records.filter((r: any) => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter((r: any) => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter((r: any) => r.status === AttendanceStatus.LATE).length;
    return { total, present, absent, late, students };
  },
};
