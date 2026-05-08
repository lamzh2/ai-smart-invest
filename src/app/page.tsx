"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIndices, useSpot } from "@/hooks/use-market-data";

function formatPrice(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(2) + "万";
  if (n >= 1000) return n.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
  return n.toFixed(2);
}

function formatLargeNum(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "万亿";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "万";
  return n.toLocaleString("zh-CN");
}

export default function DashboardPage() {
  const { data: indices, isLoading: idxLoading } = useIndices();
  const { data: spotData, isLoading: spotLoading } = useSpot(1, 5000, "change_percent", "desc");

  // Compute market overview stats
  const marketStats = useMemo(() => {
    if (!spotData?.data) return null;
    const stocks = spotData.data;
    const upCount = stocks.filter((s) => s.change_percent > 0).length;
    const downCount = stocks.filter((s) => s.change_percent < 0).length;
    const totalTurnover = stocks.reduce((sum, s) => sum + (s.turnover || 0), 0);
    const avgChange = stocks.reduce((sum, s) => sum + s.change_percent, 0) / stocks.length;
    return { upCount, downCount, totalTurnover, avgChange, total: stocks.length };
  }, [spotData]);

  const loading = idxLoading || spotLoading;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-sm text-muted-foreground">
          A 股市场全景概览 · 数据实时刷新
        </p>
      </div>

      {/* Index Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))
          : indices?.map((idx) => {
              const isUp = idx.change_percent >= 0;
              return (
                <Link key={idx.code} href={`/stock/${idx.code}`}>
                  <Card className="card-hover cursor-pointer transition-colors hover:border-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {idx.name}
                      </CardTitle>
                      {isUp ? (
                        <TrendingUp className="size-4 text-up" />
                      ) : (
                        <TrendingDown className="size-4 text-down" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold tabular-nums">
                        {idx.price.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isUp ? "text-up" : "text-down"
                        }`}
                      >
                        {idx.change >= 0 ? "+" : ""}
                        {idx.change.toFixed(2)} ({idx.change_percent >= 0 ? "+" : ""}
                        {idx.change_percent.toFixed(2)}%)
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </div>

      {/* Market Overview + AI Hot */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Market Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              市场总览
            </CardTitle>
            <Link
                href="/market"
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                全市场行情 <ArrowRight className="ml-1 size-3" />
              </Link>
          </CardHeader>
          <CardContent>
            {loading || !marketStats ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">成交额</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatLargeNum(marketStats.totalTurnover)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">上涨 / 下跌</p>
                  <p className="text-lg font-semibold tabular-nums">
                    <span className="text-up">{marketStats.upCount}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-down">{marketStats.downCount}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">平均涨跌</p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      marketStats.avgChange >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {marketStats.avgChange >= 0 ? "+" : ""}
                    {marketStats.avgChange.toFixed(2)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">统计标的</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {marketStats.total.toLocaleString()} 只
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-5 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                AI
              </span>
              AI 热点洞察
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "🔍 银行板块获北向资金持续加仓",
              "📊 科技股估值回归合理区间的信号",
              "⚡ 新能源板块异动预警：成交量激增",
            ].map((insight, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3 text-sm leading-relaxed hover:border-primary/30 transition-colors cursor-pointer"
              >
                {insight}
              </div>
            ))}
            <Badge variant="outline" className="text-xs">
              由 AI 代理生成 · 仅供参考
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4" />
            自选股行情
          </CardTitle>
          <Link
            href="/watchlist"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            管理自选 <ArrowRight className="ml-1 size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            登录后可添加自选股，获得实时行情追踪
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
