import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
  ];

  for (const appData of apps) {
    await prisma.app.upsert({
      where: { slug: appData.slug },
      update: {},
      create: appData,
    });
  }

  console.log("Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
