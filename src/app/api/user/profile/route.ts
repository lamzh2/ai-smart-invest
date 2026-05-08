/**
 * 用户资料 API
 * GET  /api/user/profile — 获取当前用户资料
 * PATCH /api/user/profile — 更新资料（name, avatarUrl）
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, updateUserProfile } from "@/lib/db-queries";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const user = await getUserById(userId);

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  let body: { name?: string; avatarUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  if (!body.name && !body.avatarUrl) {
    return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
  }

  const updated = await updateUserProfile(userId, {
    name: body.name,
    avatarUrl: body.avatarUrl,
  });

  return NextResponse.json({ success: true, user: updated });
}
