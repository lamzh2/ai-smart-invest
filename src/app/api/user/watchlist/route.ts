/**
 * 自选股 API
 * GET    /api/user/watchlist           — 获取所有自选股
 * POST   /api/user/watchlist           — 添加自选股
 * DELETE /api/user/watchlist?code=XXX  — 删除自选股
 */
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/db-queries";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const items = await getWatchlist(userId);

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  let body: { stockCode: string; stockName: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  if (!body.stockCode || !body.stockName) {
    return NextResponse.json({ error: "stockCode 和 stockName 必填" }, { status: 400 });
  }

  const item = await addToWatchlist(userId, body.stockCode, body.stockName, body.notes);
  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "缺少 stockCode 参数" }, { status: 400 });
  }

  await removeFromWatchlist(userId, code);
  return NextResponse.json({ success: true });
}
