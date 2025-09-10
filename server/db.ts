import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Check if Supabase environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;

let client: postgres.Sql;

if (supabaseUrl && supabaseUrl !== 'undefined') {
  // Use Supabase connection
  try {
    const connectionString = supabaseUrl.replace('https://', 'postgres://postgres:')
      .replace('.supabase.co', '.supabase.co:5432')
      + '/postgres';
    client = postgres(connectionString);
  } catch (error) {
    console.warn('⚠️  Failed to connect to Supabase:', error);
    client = createMockClient();
  }
} else {
  client = createMockClient();
}

function createMockClient(): postgres.Sql {
  console.warn('⚠️  Supabase not configured. Using mock database connection.');
  console.warn('   Please connect to Supabase using the "Connect to Supabase" button for full functionality.');
  
  // Create a mock postgres client that won't actually connect
  return postgres('postgresql://localhost:5432/mock', {
    host: 'localhost',
    port: 5432,
    database: 'mock',
    username: 'mock',
    password: 'mock',
    max: 1,
    idle_timeout: 1,
    connect_timeout: 1,
    onnotice: () => {},
    transform: {
      undefined: null
    }
  });
}

// Create and export drizzle database instance
export const db = drizzle(client, { schema });