/**
 * AI 选股 API
 * POST /api/ai/screener
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { streamChat } from "@/lib/ai-client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip).ok) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { criteria } = await req.json();

  try {
    const result = await streamChat([
      {
        role: "system",
        content: `你是A股量化选股分析师。请根据用户条件推荐5只A股。返回JSON格式：
{
  "stocks": [
    {"code": "000001", "name": "平安银行", "reason": "推荐理由", "score": 85}
  ],
  "summary": "总结"
}`,
      },
      { role: "user", content: `请根据以下条件筛选A股：${criteria || "综合评分最高的成长股"}` },
    ]);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    return NextResponse.json({ stocks: [], summary: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "选股失败" }, { status: 502 });
  }
}
