/**
 * AI 智投 — 数据库查询封装
 * Drizzle ORM 辅助函数
 */
import { eq, and, desc, sql, count } from "drizzle-orm";
import { db, schema } from "@/db";

const { users, watchlists, aiSessions, aiMessages, aiReports, masterStats, alerts, userPreferences } = schema;

// ===== Users =====

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user ?? null;
}

export async function updateUserProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated ?? null;
}

// ===== Watchlist =====

export async function getWatchlist(userId: string) {
  return db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId))
    .orderBy(desc(watchlists.addedAt));
}

export async function addToWatchlist(userId: string, stockCode: string, stockName: string, notes?: string) {
  const [item] = await db
    .insert(watchlists)
    .values({ userId, stockCode, stockName, notes })
    .onConflictDoUpdate({
      target: [watchlists.userId, watchlists.stockCode],
      set: { notes, addedAt: new Date() },
    })
    .returning();
  return item;
}

export async function removeFromWatchlist(userId: string, stockCode: string) {
  await db
    .delete(watchlists)
    .where(and(eq(watchlists.userId, userId), eq(watchlists.stockCode, stockCode)));
}

// ===== AI Sessions =====

export async function getSessions(userId: string, type?: string, limit = 20) {
  const conditions = type
    ? and(eq(aiSessions.userId, userId), eq(aiSessions.type, type as any))
    : eq(aiSessions.userId, userId);

  return db
    .select()
    .from(aiSessions)
    .where(conditions)
    .orderBy(desc(aiSessions.createdAt))
    .limit(limit);
}

export async function getSessionById(sessionId: string) {
  const [session] = await db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.id, sessionId))
    .limit(1);
  return session ?? null;
}

export async function createSession(data: {
  userId: string;
  type: "committee" | "chat" | "deep_research" | "screener";
  stockCode?: string;
  title: string;
}) {
  const [session] = await db.insert(aiSessions).values(data).returning();
  return session;
}

export async function completeSession(sessionId: string) {
  await db
    .update(aiSessions)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(aiSessions.id, sessionId));
}

export async function failSession(sessionId: string) {
  await db
    .update(aiSessions)
    .set({ status: "error", completedAt: new Date() })
    .where(eq(aiSessions.id, sessionId));
}

// ===== AI Messages =====

export async function getSessionMessages(sessionId: string) {
  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(aiMessages.createdAt);
}

export async function saveMessage(data: {
  sessionId: string;
  role: "user" | "assistant" | "system" | "master" | "risk" | "chairman";
  masterName?: string;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const [message] = await db.insert(aiMessages).values(data).returning();
  return message;
}

// ===== AI Reports =====

export async function getUserReports(userId: string, limit = 20) {
  return db
    .select()
    .from(aiReports)
    .where(eq(aiReports.userId, userId))
    .orderBy(desc(aiReports.createdAt))
    .limit(limit);
}

export async function getReportById(reportId: string) {
  const [report] = await db
    .select()
    .from(aiReports)
    .where(eq(aiReports.id, reportId))
    .limit(1);
  return report ?? null;
}

export async function saveReport(data: {
  userId: string;
  sessionId?: string;
  stockCode: string;
  stockName: string;
  title: string;
  content: string;
  summary: string;
  recommendation?: "buy" | "hold" | "sell" | "watch";
  confidence?: number;
  tags?: string[];
}) {
  const [report] = await db
    .insert(aiReports)
    .values({ ...data, tags: data.tags ?? [] } as any)
    .returning();
  return report;
}

// ===== Master Stats =====

export async function getAllMasterStats() {
  return db
    .select()
    .from(masterStats)
    .orderBy(desc(masterStats.accuracyRate));
}

export async function upsertMasterStat(data: {
  masterName: string;
  avatarUrl?: string;
  totalPredictions?: number;
  correctPredictions?: number;
  accuracyRate?: number;
  avgReturn?: number;
}) {
  const [stat] = await db
    .insert(masterStats)
    .values(data as any)
    .onConflictDoUpdate({
      target: masterStats.masterName,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return stat;
}

// ===== Alerts =====

export async function getUserAlerts(userId: string) {
  return db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt));
}

export async function createAlert(data: {
  userId: string;
  stockCode: string;
  stockName: string;
  alertType: "price_up" | "price_down" | "volume_surge" | "technical_breakout" | "custom";
  threshold: Record<string, unknown>;
}) {
  const [alert] = await db.insert(alerts).values(data as any).returning();
  return alert;
}

export async function toggleAlert(alertId: string, isActive: boolean) {
  await db.update(alerts).set({ isActive }).where(eq(alerts.id, alertId));
}

export async function deleteAlert(alertId: string) {
  await db.delete(alerts).where(eq(alerts.id, alertId));
}

// ===== User Preferences =====

export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}

export async function upsertUserPreferences(
  userId: string,
  data: {
    theme?: "dark" | "light";
    defaultAIModel?: string;
    riskTolerance?: "conservative" | "moderate" | "aggressive";
    notificationEnabled?: boolean;
  }
) {
  const [prefs] = await db
    .insert(userPreferences)
    .values({ userId, ...data } as any)
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return prefs;
}

// ===== Stats =====

export async function getSessionCount(userId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(aiSessions)
    .where(eq(aiSessions.userId, userId));
  return result?.total ?? 0;
}
