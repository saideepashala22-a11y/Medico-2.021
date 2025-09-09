import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use a fallback database URL if DATABASE_URL is not set
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://localhost:5432/fallback_db';

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.warn('Warning: No database URL found. Using fallback configuration. Please set DATABASE_URL or POSTGRES_URL environment variable.');
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });