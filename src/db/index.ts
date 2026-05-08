/**
 * AI 智投 — 数据库连接
 * PostgreSQL via Neon (Serverless), Drizzle ORM
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "❌ DATABASE_URL is not defined. Please set it in your .env.local file.\n" +
      "   Get a free Neon PostgreSQL database at https://neon.tech"
  );
}

// Singleton connection pool (Edge-compatible)
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function createClient() {
  return postgres(DATABASE_URL!, {
    ssl: "require",
    max: 10, // connection pool size
    idle_timeout: 20, // seconds
    connect_timeout: 10, // seconds
  });
}

function createDb(client: ReturnType<typeof postgres>) {
  return drizzle(client, { schema });
}

export const client = globalForDb.client ?? createClient();
export const db = globalForDb.db ?? createDb(client);

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
  globalForDb.db = db;
}

// Re-export schema for convenience
export { schema };
