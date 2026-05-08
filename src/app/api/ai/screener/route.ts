/**
 * AI 选股 API 代理 (SSE 流式)
 * POST /api/ai/screener → POST {FASTAPI_URL}/api/v1/ai/screener
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "请先登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.ok) {
    return new Response(
      JSON.stringify({ error: "请求过于频繁，请1小时后再试" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();

  try {
    const backendRes = await fetch(`${FASTAPI_URL}/api/v1/ai/screener`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      duplex: "half",
    } as RequestInit);

    if (!backendRes.ok) {
      const err = await backendRes.text();
      return new Response(err, { status: backendRes.status });
    }

    return new Response(backendRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "AI 服务暂不可用" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
