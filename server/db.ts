import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";


// Supabase database connection
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL must be set. Please connect to Supabase.');
}

// Initialize postgres client
const client = postgres(databaseUrl);

// Create and export drizzle database instance
export const db = drizzle(client, { schema });