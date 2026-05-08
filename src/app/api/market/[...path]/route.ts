/**
 * 行情数据代理路由 — 将前端请求转发到 FastAPI 后端
 *
 * 路由: /api/market/[...path] → http://{FASTAPI_URL}/api/v1/market/[...path]
 * 目的: 避免 CORS 问题、隐藏后端 URL、统一鉴权
 */
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const queryString = request.nextUrl.search;

  const targetUrl = `${FASTAPI_URL}/api/v1/market/${pathStr}${queryString}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "Content-Type": "application/json",
        // Forward auth if needed
        ...(request.headers.get("authorization")
          ? { Authorization: request.headers.get("authorization")! }
          : {}),
      },
      // Don't cache realtime data on server
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        // Allow short client-side cache for performance
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error(`[Market Proxy] Failed to proxy ${pathStr}:`, error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "数据服务暂不可用，请稍后重试",
      },
      { status: 502 }
    );
  }
}
