/**
 * 大师排行榜 API 代理
 * GET /api/ai/leaderboard → GET {FASTAPI_URL}/api/v1/ai/leaderboard
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请1小时后再试" },
      { status: 429 }
    );
  }

  try {
    const backendRes = await fetch(`${FASTAPI_URL}/api/v1/ai/leaderboard`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      { error: "AI 服务暂不可用" },
      { status: 502 }
    );
  }
}
