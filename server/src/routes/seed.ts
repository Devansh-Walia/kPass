import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "koshish-family" },
    update: {},
    create: { name: "Koshish Family", slug: "koshish-family" },
  });

  // Create admin user
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await prisma.user.upsert({
    where: { email: "admin@koshishFamily.org" },
    update: {},
    create: {
      email: "admin@koshishFamily.org",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      orgId: org.id,
      mustChangePassword: true,
    },
  });

  // Create apps
  const apps = [
    { name: "Finance Dashboard", slug: "finance", type: "FINANCE" as const, route: "/apps/finance", description: "Track income, expenses, and financial reports" },
    { name: "CRM", slug: "crm", type: "CRM" as const, route: "/apps/crm", description: "Manage contacts, deals, and activities" },
    { name: "Task Board", slug: "task-board", type: "TASK_BOARD" as const, route: "/apps/task-board", description: "Kanban-style task management across teams" },
    { name: "Student Tracker", slug: "student-tracker", type: "STUDENT_TRACKER" as const, route: "/apps/student-tracker", description: "Manage student enrollment, attendance, and progress" },
    { name: "Needs Registry", slug: "needs-registry", type: "NEEDS_REGISTRY" as const, route: "/apps/needs-registry", description: "Track and fulfill children's needs" },
    { name: "People Directory", slug: "people-directory", type: "HR" as const, route: "/apps/people-directory", description: "Employee profiles and directory" },
    { name: "Attendance", slug: "attendance", type: "ATTENDANCE" as const, route: "/apps/attendance", description: "Staff attendance and leave management" },
    { name: "Ideation", slug: "ideation", type: "IDEATION" as const, route: "/apps/ideation", description: "Brainstorm and vote on campaign ideas" },
    { name: "Content Calendar", slug: "content-calendar", type: "CONTENT_CALENDAR" as const, route: "/apps/content-calendar", description: "Plan and schedule social media content" },
    { name: "Event Manager", slug: "event-manager", type: "EVENT_MANAGER" as const, route: "/apps/event-manager", description: "Plan events and manage volunteers" },
    { name: "Workshop Tracker", slug: "workshop-tracker", type: "WORKSHOP" as const, route: "/apps/workshop-tracker", description: "Schedule workshops and track participation" },
    { name: "Donor Management", slug: "donor-mgmt", type: "DONOR_MGMT" as const, route: "/apps/donor-mgmt", description: "Track donors, sponsorships, and donations" },
  ];

  for (const appData of apps) {
    await prisma.app.upsert({
      where: { slug: appData.slug },
      update: {},
      create: appData,
    });
  }

  // Create departments with default app mappings
  const departments = [
    { name: "COE", slug: "coe", appSlugs: ["task-board"] },
    { name: "HR", slug: "hr", appSlugs: ["people-directory", "attendance"] },
    { name: "Pathshala", slug: "pathshala", appSlugs: ["student-tracker"] },
    { name: "CDK", slug: "cdk", appSlugs: ["needs-registry"] },
    { name: "Marketing", slug: "marketing", appSlugs: ["ideation", "content-calendar"] },
    { name: "PR", slug: "pr", appSlugs: ["event-manager"] },
    { name: "Art & Craft", slug: "art-craft", appSlugs: ["workshop-tracker"] },
    { name: "Sales", slug: "sales", appSlugs: ["donor-mgmt"] },
    { name: "Finance", slug: "finance-dept", appSlugs: ["finance"] },
  ];

  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: { name: dept.name, slug: dept.slug },
    });

    for (const appSlug of dept.appSlugs) {
      const app = await prisma.app.findUnique({ where: { slug: appSlug } });
      if (app) {
        await prisma.departmentApp.upsert({
          where: { departmentId_appId: { departmentId: department.id, appId: app.id } },
          update: {},
          create: { departmentId: department.id, appId: app.id },
        });
      }
    }
  }

  res.json({ data: "Seed complete. Login: admin@koshishFamily.org / changeme123" });
});

export default router;
