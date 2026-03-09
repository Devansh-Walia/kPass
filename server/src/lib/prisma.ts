import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaPg({
  host: url.hostname,
  port: Number(url.port) || 5432,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
});
export const prisma = new PrismaClient({ adapter });
