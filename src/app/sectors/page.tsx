"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, PieChart, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSectors, useNorthbound } from "@/hooks/use-market-data";
import { NorthboundChart } from "@/components/charts/northbound-chart";
import type { SectorItem } from "@/types/market";

type SortField = "change_percent" | "total_market_value" | "turnover_rate";
type SortDir = "asc" | "desc";

function formatMarketCap(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "万亿";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "亿";
  return n.toLocaleString("zh-CN");
}

export default function SectorsPage() {
  const [sortField, setSortField] = useState<SortField>("change_percent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: sectors, isLoading: sectorsLoading } = useSectors();
  const { data: northbound, isLoading: nbLoading } = useNorthbound(30);

  const sectorList = sectors ?? [];

  // Sort
  const sortedSectors = useMemo(() => {
    return [...sectorList].sort((a, b) => {
      const aVal = Number(a[sortField] ?? 0);
      const bVal = Number(b[sortField] ?? 0);
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [sectorList, sortField, sortDir]);

  // Heatmap colors: green for up, red for down
  const getHeatColor = (changePercent: number): string => {
    const abs = Math.min(Math.abs(changePercent), 10) / 10;
    if (changePercent > 0) {
      const r = Math.round(0 * (1 - abs));
      const g = Math.round(200 * abs);
      const b = Math.round(83 * abs);
      return `rgba(${r}, ${g}, ${b}, ${0.15 + abs * 0.35})`;
    }
    if (changePercent < 0) {
      const r = Math.round(255 * abs);
      const g = Math.round(82 * (1 - abs));
      const b = Math.round(82 * (1 - abs));
      return `rgba(${r}, ${g}, ${b}, ${0.15 + abs * 0.35})`;
    }
    return "rgba(128,128,128,0.1)";
  };

  // Stats
  const stats = useMemo(() => {
    if (!sectorList.length) return null;
    const up = sectorList.filter((s) => s.change_percent > 0).length;
    const down = sectorList.filter((s) => s.change_percent < 0).length;
    const topSector = sortedSectors[0];
    return { up, down, total: sectorList.length, topSector };
  }, [sectorList, sortedSectors]);

  // Northbound stats
  const nbStats = useMemo(() => {
    if (!northbound?.length) return null;
    const totalNet = northbound.reduce((sum, d) => sum + (d.net_flow ?? 0), 0);
    const recent5 = northbound.slice(-5);
    const recent5Net = recent5.reduce((sum, d) => sum + (d.net_flow ?? 0), 0);
    const todayFlow = northbound[northbound.length - 1]?.net_flow ?? 0;
    return { totalNet, recent5Net, todayFlow, days: northbound.length };
  }, [northbound]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">板块分析</h1>
        <p className="text-sm text-muted-foreground">
          行业板块行情 + 北向资金流向
        </p>
      </div>

      {/* Sector Stats */}
      {sectorsLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : stats ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="bg-muted/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">板块总数</p>
              <p className="text-xl font-bold tabular-nums">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">上涨板块</p>
              <p className="text-xl font-bold text-up tabular-nums">{stats.up}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">下跌板块</p>
              <p className="text-xl font-bold text-down tabular-nums">{stats.down}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">领涨板块</p>
              <p className="text-lg font-bold tabular-nums truncate">
                {stats.topSector?.name ?? "—"}
              </p>
              <span className={`text-xs ${(stats.topSector?.change_percent ?? 0) >= 0 ? "text-up" : "text-down"}`}>
                {stats.topSector?.change_percent != null
                  ? `${stats.topSector.change_percent >= 0 ? "+" : ""}${stats.topSector.change_percent.toFixed(2)}%`
                  : ""}
              </span>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Sector Heatmap + Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChart className="size-4" />
            行业板块热力图
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sectorsLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <>
              {/* Heatmap Grid */}
              <div className="mb-4 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                {sortedSectors.slice(0, 48).map((sector) => (
                  <div
                    key={sector.name}
                    className="rounded-md p-2 text-center cursor-pointer hover:scale-105 transition-transform"
                    style={{ background: getHeatColor(sector.change_percent) }}
                    title={`${sector.name}\n涨跌: ${sector.change_percent.toFixed(2)}%`}
                  >
                    <p className="text-[10px] font-medium truncate leading-tight">
                      {sector.name}
                    </p>
                    <p
                      className={`text-xs font-bold tabular-nums ${
                        sector.change_percent > 0
                          ? "text-up"
                          : sector.change_percent < 0
                          ? "text-down"
                          : "text-muted-foreground"
                      }`}
                    >
                      {sector.change_percent > 0 ? "+" : ""}
                      {sector.change_percent.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>

              {/* Sortable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 text-left font-medium">板块名称</th>
                      <th
                        className="py-2 text-right font-medium cursor-pointer hover:text-foreground"
                        onClick={() => {
                          if (sortField === "change_percent") setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                          else { setSortField("change_percent"); setSortDir("desc"); }
                        }}
                      >
                        涨跌幅 <ArrowUpDown className="ml-1 inline size-3" />
                      </th>
                      <th className="py-2 text-right font-medium">最新价</th>
                      <th
                        className="py-2 text-right font-medium cursor-pointer hover:text-foreground"
                        onClick={() => {
                          if (sortField === "total_market_value") setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                          else { setSortField("total_market_value"); setSortDir("desc"); }
                        }}
                      >
                        总市值
                      </th>
                      <th className="py-2 text-right font-medium">涨跌分布</th>
                      <th className="py-2 text-left font-medium">领涨股</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSectors.map((sector) => (
                      <tr
                        key={sector.name}
                        className="border-b border-border/50 hover:bg-accent/20 transition-colors"
                      >
                        <td className="py-2.5 font-medium">{sector.name}</td>
                        <td
                          className={`py-2.5 text-right tabular-nums font-semibold ${
                            sector.change_percent > 0
                              ? "text-up"
                              : sector.change_percent < 0
                              ? "text-down"
                              : ""
                          }`}
                        >
                          {sector.change_percent > 0 ? "+" : ""}
                          {sector.change_percent.toFixed(2)}%
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {sector.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-xs">
                          {sector.total_market_value
                            ? formatMarketCap(sector.total_market_value)
                            : "—"}
                        </td>
                        <td className="py-2.5 text-right text-xs">
                          <span className="text-up">{sector.up_count ?? 0}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-down">{sector.down_count ?? 0}</span>
                        </td>
                        <td className="py-2.5 text-xs">
                          {sector.lead_stock ? (
                            <span>
                              {sector.lead_stock}
                              {sector.lead_change != null && (
                                <span
                                  className={`ml-1 ${
                                    sector.lead_change >= 0 ? "text-up" : "text-down"
                                  }`}
                                >
                                  {sector.lead_change >= 0 ? "+" : ""}
                                  {sector.lead_change.toFixed(2)}%
                                </span>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Northbound Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="size-4" />
            北向资金流向
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nbLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <>
              {/* Northbound Stats */}
              {nbStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">今日净流入</p>
                    <p
                      className={`text-lg font-bold tabular-nums ${
                        nbStats.todayFlow >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {nbStats.todayFlow >= 0 ? "+" : ""}
                      {(nbStats.todayFlow / 1e8).toFixed(2)} 亿
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">近5日净流入</p>
                    <p
                      className={`text-lg font-bold tabular-nums ${
                        nbStats.recent5Net >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {nbStats.recent5Net >= 0 ? "+" : ""}
                      {(nbStats.recent5Net / 1e8).toFixed(2)} 亿
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">累计净流入</p>
                    <p
                      className={`text-lg font-bold tabular-nums ${
                        nbStats.totalNet >= 0 ? "text-up" : "text-down"
                      }`}
                    >
                      {nbStats.totalNet >= 0 ? "+" : ""}
                      {(nbStats.totalNet / 1e8).toFixed(2)} 亿
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">统计天数</p>
                    <p className="text-lg font-bold tabular-nums">
                      {nbStats.days} 天
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              {northbound && northbound.length > 0 && (
                <NorthboundChart data={northbound} />
              )}

              {/* History Table */}
              {northbound && northbound.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-2 text-left font-medium">日期</th>
                        <th className="py-2 text-right font-medium">净流入 (亿)</th>
                        <th className="py-2 text-right font-medium">方向</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...northbound].reverse().slice(0, 20).map((item, i) => {
                        const flow = item.net_flow ?? 0;
                        const isInflow = flow >= 0;
                        return (
                          <tr
                            key={item.date ?? i}
                            className="border-b border-border/50 hover:bg-accent/20"
                          >
                            <td className="py-2 text-xs">{item.date ?? "—"}</td>
                            <td
                              className={`py-2 text-right tabular-nums text-xs font-semibold ${
                                isInflow ? "text-up" : "text-down"
                              }`}
                            >
                              {isInflow ? "+" : ""}
                              {(flow / 1e8).toFixed(2)}
                            </td>
                            <td className="py-2 text-right">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  isInflow
                                    ? "text-up border-up/30"
                                    : "text-down border-down/30"
                                }`}
                              >
                                {isInflow ? "流入" : "流出"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
