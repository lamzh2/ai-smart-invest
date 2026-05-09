/**
 * AI 智投 — 数据库连接 (惰性初始化)
 * PostgreSQL via Neon (Serverless), Drizzle ORM
 * 
 * 生产构建时 DATABASE_URL 可能不可用，只在首次查询时才初始化连接。
 */
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DbClient = ReturnType<typeof postgres>;
type DbInstance = PostgresJsDatabase<typeof schema>;

// Singleton connection pool
const globalForDb = globalThis as unknown as {
  client?: DbClient;
  db?: DbInstance;
  initialized: boolean;
};

function createClient(databaseUrl: string): DbClient {
  return postgres(databaseUrl, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function createDb(client: DbClient): DbInstance {
  return drizzle(client, { schema });
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "❌ DATABASE_URL is not defined. Please set it in your environment.\n" +
      "   Get a free Neon PostgreSQL database at https://neon.tech"
    );
  }
  return url;
}

function initDb(): { client: DbClient; db: DbInstance } {
  if (!globalForDb.client || !globalForDb.db) {
    const databaseUrl = getDatabaseUrl();
    const client = createClient(databaseUrl);
    const db = createDb(client);
    globalForDb.client = client;
    globalForDb.db = db;
    globalForDb.initialized = true;
  }
  return { client: globalForDb.client, db: globalForDb.db };
}

// Lazy getter — does NOT throw at import time
export function getDb(): DbInstance {
  const { db } = initDb();
  return db;
}

// Legacy export for backward compatibility — lazy too
const dbProxy = new Proxy({} as DbInstance, {
  get(_, prop) {
    const db = getDb();
    const value = (db as any)[prop];
    if (typeof value === "function") {
      return (...args: any[]) => (value as Function).apply(db, args);
    }
    return value;
  },
});

export const db = dbProxy;

// Re-export schema
export { schema };
