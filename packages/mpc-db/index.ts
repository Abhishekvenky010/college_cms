import "dotenv/config";
// @ts-ignore
import { PrismaClient } from "./generated/prisma/client";
// @ts-ignore
import { PrismaPg } from "@prisma/adapter-pg";
// @ts-ignore
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// @ts-ignore
const pool = new Pool({ connectionString });
// @ts-ignore
const adapter = new PrismaPg(pool);
// @ts-ignore
export const prismaClient = new PrismaClient({ adapter });