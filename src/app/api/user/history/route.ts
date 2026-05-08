/**
 * AI 分析历史 API
 * GET /api/user/history?type=committee|chat|deep_research|screener&limit=20
 */
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { getSessions, getUserReports, getSessionMessages } from "@/lib/db-queries";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const withMessages = searchParams.get("withMessages") === "true";
  const sessionId = searchParams.get("sessionId");

  // Single session detail
  if (sessionId && withMessages) {
    const messages = await getSessionMessages(sessionId);
    return NextResponse.json({ messages });
  }

  // List sessions
  const sessions = await getSessions(userId, type, limit);

  // Also get reports
  const reports = await getUserReports(userId, limit);

  return NextResponse.json({
    sessions,
    reports,
    total: sessions.length,
  });
}
