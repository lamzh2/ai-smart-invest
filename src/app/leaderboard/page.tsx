"use client";

/**
 * 大师排行榜页面 — Master Ranking
 * 展示 8 位 AI 投资大师历史战绩 PK
 */
import { useState, useEffect } from "react";
import { Trophy, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterRanking } from "@/components/ai/MasterRanking";
import type { LeaderboardData } from "@/types/ai";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/leaderboard");
      if (!res.ok) throw new Error("获取失败");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data as LeaderboardData);
      } else {
        setError(json.message || "数据加载失败");
      }
    } catch {
      setError("网络异常");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Trophy className="size-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">大师排行榜</h1>
            <p className="text-sm text-muted-foreground">8 位 AI 投资大师历史战绩 PK · 模拟数据</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          刷新
        </Button>
      </div>

      {/* Content */}
      <div className="mt-4 flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground/30" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
            <AlertTriangle className="size-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">
              重试
            </Button>
          </div>
        )}

        {data && <MasterRanking rankings={data.rankings} />}
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground/40 shrink-0">
        ⚠️ 排行榜为 AI 模拟数据，仅供娱乐和教学参考，不构成投资建议
      </p>
    </div>
  );
}

import { cn } from "@/lib/utils";
