import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Supabase database connection
const databaseUrl = process.env.SUPABASE_URL 
  ? `${process.env.SUPABASE_URL}?sslmode=require`
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('SUPABASE_URL must be set. Please connect to Supabase using the "Connect to Supabase" button.');
}

// Initialize postgres client with Supabase-compatible settings
const client = postgres(databaseUrl, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create and export drizzle database instance
export const db = drizzle(client, { schema });