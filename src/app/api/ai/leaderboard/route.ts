/**
 * 大师排行榜 API
 * GET /api/ai/leaderboard
 */
import { NextResponse } from "next/server";

// 模拟大师排行榜数据
const LEADERBOARD = {
  masters: [
    { id: "simons", name: "西蒙斯", accuracy: 72.5, totalCalls: 42, avgConfidence: 78, winStreak: 5 },
    { id: "buffett", name: "巴菲特", accuracy: 68.3, totalCalls: 35, avgConfidence: 85, winStreak: 3 },
    { id: "lynch", name: "彼得·林奇", accuracy: 65.8, totalCalls: 38, avgConfidence: 72, winStreak: 2 },
    { id: "dalio", name: "达利欧", accuracy: 63.1, totalCalls: 30, avgConfidence: 80, winStreak: 4 },
    { id: "graham", name: "格雷厄姆", accuracy: 61.5, totalCalls: 33, avgConfidence: 82, winStreak: 1 },
    { id: "soros", name: "索罗斯", accuracy: 59.2, totalCalls: 40, avgConfidence: 70, winStreak: 0 },
    { id: "rogers", name: "罗杰斯", accuracy: 57.8, totalCalls: 28, avgConfidence: 68, winStreak: 2 },
    { id: "livermore", name: "利弗莫尔", accuracy: 55.4, totalCalls: 45, avgConfidence: 65, winStreak: 0 },
  ],
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json(LEADERBOARD, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
