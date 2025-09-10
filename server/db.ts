import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
// Check if Supabase environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let client: postgres.Sql;

if (supabaseUrl && supabaseAnonKey) {
  // Use Supabase connection
  const connectionString = supabaseUrl.replace('https://', 'postgres://postgres:')
    .replace('.supabase.co', '.supabase.co:5432')
    + '/postgres';
  client = postgres(connectionString);
} else {
  // Use a mock connection for development when Supabase is not configured
  console.warn('⚠️  Supabase not configured. Using mock database connection.');
  console.warn('   Please connect to Supabase using the "Connect to Supabase" button for full functionality.');
  
  // Create a mock postgres client that won't actually connect
  client = postgres('postgresql://localhost:5432/mock', {
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
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create and export drizzle database instance
export const db = drizzle(client, { schema });