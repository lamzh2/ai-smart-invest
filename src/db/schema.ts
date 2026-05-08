/**
 * AI 智投 — 数据库 Schema
 * 8 张核心表: users, watchlists, ai_sessions, ai_messages, ai_reports, master_stats, alerts, user_preferences
 * Drizzle ORM + PostgreSQL (Neon)
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ===== Enums =====

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const sessionTypeEnum = pgEnum("session_type", [
  "committee",
  "chat",
  "deep_research",
  "screener",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "running",
  "completed",
  "error",
]);
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "master",
  "risk",
  "chairman",
]);
export const recommendationEnum = pgEnum("recommendation", [
  "buy",
  "hold",
  "sell",
  "watch",
]);
export const alertTypeEnum = pgEnum("alert_type", [
  "price_up",
  "price_down",
  "volume_surge",
  "technical_breakout",
  "custom",
]);
export const themeEnum = pgEnum("theme", ["dark", "light"]);
export const riskToleranceEnum = pgEnum("risk_tolerance", [
  "conservative",
  "moderate",
  "aggressive",
]);

// ===== Tables =====

/** users — 用户表 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("idx_users_email").on(table.email)]
);

/** watchlists — 自选股 */
export const watchlists = pgTable(
  "watchlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stockCode: varchar("stock_code", { length: 10 }).notNull(),
    stockName: varchar("stock_name", { length: 50 }).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("idx_watchlists_user").on(table.userId),
    uniqueIndex("idx_watchlists_user_stock").on(table.userId, table.stockCode),
  ]
);

/** ai_sessions — AI 分析会话 */
export const aiSessions = pgTable(
  "ai_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: sessionTypeEnum("type").notNull(),
    stockCode: varchar("stock_code", { length: 10 }),
    title: varchar("title", { length: 255 }).notNull(),
    status: sessionStatusEnum("status").default("running").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [index("idx_sessions_user").on(table.userId, table.createdAt.desc())]
);

/** ai_messages — AI 对话消息 */
export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => aiSessions.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    masterName: varchar("master_name", { length: 100 }),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_messages_session").on(table.sessionId, table.createdAt),
  ]
);

/** ai_reports — AI 深度研究报告 */
export const aiReports = pgTable(
  "ai_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => aiSessions.id, {
      onDelete: "set null",
    }),
    stockCode: varchar("stock_code", { length: 10 }).notNull(),
    stockName: varchar("stock_name", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    summary: text("summary").notNull(),
    recommendation: recommendationEnum("recommendation"),
    confidence: real("confidence"),
    tags: jsonb("tags").default("[]").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_reports_user").on(table.userId, table.createdAt.desc())]
);

/** master_stats — 大师历史战绩统计 */
export const masterStats = pgTable("master_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  masterName: varchar("master_name", { length: 100 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  totalPredictions: integer("total_predictions").default(0).notNull(),
  correctPredictions: integer("correct_predictions").default(0).notNull(),
  accuracyRate: real("accuracy_rate").default(0).notNull(),
  avgReturn: real("avg_return"),
  stocksTracked: jsonb("stocks_tracked").default("[]").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/** alerts — 盯盘预警 */
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stockCode: varchar("stock_code", { length: 10 }).notNull(),
    stockName: varchar("stock_name", { length: 50 }).notNull(),
    alertType: alertTypeEnum("alert_type").notNull(),
    threshold: jsonb("threshold").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastTriggeredAt: timestamp("last_triggered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_alerts_user_active").on(table.userId, table.isActive)]
);

/** user_preferences — 用户偏好设置 */
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: themeEnum("theme").default("dark").notNull(),
  defaultAIModel: varchar("default_ai_model", { length: 50 }).default("deepseek-chat").notNull(),
  riskTolerance: riskToleranceEnum("risk_tolerance").default("moderate").notNull(),
  notificationEnabled: boolean("notification_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ===== Type Exports =====
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WatchlistItem = typeof watchlists.$inferSelect;
export type NewWatchlistItem = typeof watchlists.$inferInsert;
export type AiSession = typeof aiSessions.$inferSelect;
export type NewAiSession = typeof aiSessions.$inferInsert;
export type AiMessage = typeof aiMessages.$inferSelect;
export type NewAiMessage = typeof aiMessages.$inferInsert;
export type AiReport = typeof aiReports.$inferSelect;
export type NewAiReport = typeof aiReports.$inferInsert;
export type MasterStat = typeof masterStats.$inferSelect;
export type NewMasterStat = typeof masterStats.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
