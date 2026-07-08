import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

// Using dynamic import or standard init since PrismaBetterSqlite3 accepts url
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
