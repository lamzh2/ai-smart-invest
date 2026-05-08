"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { KlineChart } from "@/components/charts/kline-chart";
import { MinuteChart } from "@/components/charts/minute-chart";
import { TechnicalIndicators } from "@/components/charts/technical-indicators";
import {
  useStockDetail,
  useKline,
  useMinuteData,
  useFundamentals,
} from "@/hooks/use-market-data";
import type { StockSpot, KlineItem } from "@/types/market";

type Period = "minute" | "daily" | "weekly" | "monthly";
const PERIOD_LABELS: Record<Period, string> = {
  minute: "分时",
  daily: "日K",
  weekly: "周K",
  monthly: "月K",
};

function formatVolume(n: number): string {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "万";
  return String(n);
}

function formatAmount(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "万亿";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "万";
  return n.toLocaleString("zh-CN");
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "万亿";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "亿";
  return n.toLocaleString("zh-CN");
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [period, setPeriod] = useState<Period>("daily");

  const { data: detail, isLoading: detailLoading, error: detailError } = useStockDetail(code);
  const { data: klineData, isLoading: klineLoading } = useKline(code, period === "minute" ? "daily" : period, undefined, undefined, 250);
  const { data: minuteData, isLoading: minuteLoading } = useMinuteData(code);
  const { data: fundamentals, isLoading: fundLoading } = useFundamentals(code);

  const spot = detail?.spot;
  const isUp = (spot?.change_percent ?? 0) >= 0;
  const colorClass = isUp ? "text-up" : "text-down";
  const bgColorClass = isUp ? "bg-up/10" : "bg-down/10";

  // Error state
  if (detailError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="size-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">无法加载股票数据</h2>
        <p className="text-muted-foreground text-sm mb-4">
          股票代码 {code} 可能不存在或数据源暂不可用
        </p>
        <Button variant="outline" onClick={() => router.push("/market")}>
          <ArrowLeft className="mr-2 size-4" />
          返回行情列表
        </Button>
      </div>
    );
  }

  // Loading state
  if (detailLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/market" className="hover:text-foreground transition-colors">
          行情
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{spot?.name ?? code}</span>
      </div>

      {/* Stock Header Card */}
      <Card className={`${bgColorClass} border-0`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {spot?.name ?? "—"}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {code}
                </Badge>
              </div>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-extrabold tabular-nums ${colorClass}`}>
                  {spot?.price?.toFixed(2) ?? "—"}
                </span>
                <span className={`text-lg font-semibold tabular-nums ${colorClass}`}>
                  {spot?.change != null && spot.change >= 0 ? "+" : ""}
                  {spot?.change?.toFixed(2) ?? "—"}
                </span>
                <span className={`text-lg font-semibold tabular-nums ${colorClass}`}>
                  ({spot?.change_percent != null && spot.change_percent >= 0 ? "+" : ""}
                  {spot?.change_percent?.toFixed(2) ?? "—"}%)
                </span>
                {isUp ? (
                  <TrendingUp className={`size-5 ${colorClass}`} />
                ) : (
                  <TrendingDown className={`size-5 ${colorClass}`} />
                )}
              </div>
            </div>
            {/* Volume summary */}
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">成交量</p>
                <p className="font-semibold tabular-nums">
                  {spot?.volume ? formatVolume(spot.volume) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">成交额</p>
                <p className="font-semibold tabular-nums">
                  {spot?.turnover ? formatAmount(spot.turnover) : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OHLCV Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {[
          { label: "开盘", value: spot?.open },
          { label: "最高", value: spot?.high },
          { label: "最低", value: spot?.low },
          { label: "昨收", value: spot?.pre_close },
          { label: "换手率", value: spot?.turnover_rate, suffix: "%", decimals: 2 },
          { label: "量比", value: spot?.volume_ratio, decimals: 2 },
          { label: "市盈率", value: spot?.pe, decimals: 1 },
          { label: "市净率", value: spot?.pb, decimals: 2 },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-card p-3 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-sm font-semibold tabular-nums">
              {item.value != null
                ? item.suffix
                  ? item.value.toFixed(item.decimals ?? 2) + item.suffix
                  : item.value.toFixed(item.decimals ?? 2)
                : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Period Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              period === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "minute" && <Clock className="size-3.5" />}
            {key !== "minute" && <Activity className="size-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Main Chart Area */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="size-4" />
              {period === "minute" ? "分时图" : `${PERIOD_LABELS[period]}线图`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-4">
            {period === "minute" ? (
              <MinuteChart
                data={minuteData ?? []}
                spot={spot ?? undefined}
                isLoading={minuteLoading}
              />
            ) : (
              <KlineChart
                data={klineData ?? []}
                period={period}
                isLoading={klineLoading}
              />
            )}
          </CardContent>
        </Card>

        {/* Sidebar: Market Cap + Fundamentals */}
        <div className="space-y-4">
          {/* Market Cap Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                市值概览
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">总市值</p>
                <p className="text-lg font-semibold tabular-nums">
                  {spot?.total_market_value
                    ? formatMarketCap(spot.total_market_value)
                    : "—"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">流通市值</p>
                <p className="text-lg font-semibold tabular-nums">
                  {spot?.circulating_market_value
                    ? formatMarketCap(spot.circulating_market_value)
                    : "—"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">60日涨跌</p>
                <p
                  className={`text-lg font-semibold tabular-nums ${
                    (spot?.change_60d ?? 0) >= 0 ? "text-up" : "text-down"
                  }`}
                >
                  {spot?.change_60d != null
                    ? `${spot.change_60d >= 0 ? "+" : ""}${spot.change_60d.toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Quick Link */}
          <Card className="card-hover cursor-pointer border-primary/20 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex size-5 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                  AI
                </span>
                <span className="text-sm font-medium">AI 分析</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                调用投资委员会，8 位大师联合分析
              </p>
              <Link href={`/committee?code=${code}`}>
                <Button size="sm" className="w-full text-xs">
                  立即分析
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical Indicators */}
      {period !== "minute" && klineData && klineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="size-4" />
              技术指标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TechnicalIndicators data={klineData} />
          </CardContent>
        </Card>
      )}

      {/* Fundamentals */}
      {fundamentals && fundamentals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">基本面数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {fundamentals.map((row, i) => (
                      <th key={i} className="px-3 py-2 text-right font-normal">
                        {String(row?.report_date ?? row?.date ?? "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "营业收入", key: "revenue" },
                    { label: "净利润", key: "net_profit" },
                    { label: "每股收益", key: "eps" },
                    { label: "净资产", key: "net_assets" },
                  ].map((metric) => (
                    <tr key={metric.key} className="border-b border-border/50">
                      <td className="px-3 py-2 text-muted-foreground">
                        {metric.label}
                      </td>
                      {fundamentals.map((row, i) => (
                        <td key={i} className="px-3 py-2 text-right tabular-nums">
                          {row?.[metric.key] != null
                            ? formatAmount(Number(row[metric.key]))
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
