"use client";

/**
 * AI 选股页面 — 多维度筛选 + AI 智能匹配 + 结果表格
 */
import { useState, useRef, useCallback } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterPanel, type ScreenerFilters } from "@/components/ai/FilterPanel";
import { cn } from "@/lib/utils";
import type { ScreenerResult } from "@/types/ai";

export default function ScreenerPage() {
  const [filters, setFilters] = useState<ScreenerFilters>({});
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    // Clean empty values
    const cleanFilters: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v && v !== "") cleanFilters[k] = v;
    }

    if (Object.keys(cleanFilters).length === 0) {
      setError("请至少设置一项筛选条件");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResults([]);
    setSummary(null);

    try {
      const res = await fetch("/api/ai/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: cleanFilters }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        setError(err.error || "AI 服务暂不可用");
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setIsLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          else if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          else if (line === "" && eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "results") {
                const rawResults = (data.results || data.data?.results || []) as unknown[];
                setResults(rawResults as ScreenerResult[]);
                setSummary({
                  totalMatches: data.totalMatches || rawResults.length,
                  screeningLogic: data.screeningLogic || "",
                  disclaimer: data.disclaimer || "",
                });
              } else if (eventType === "error") {
                setError((data.message as string) || "选股失败");
              }
            } catch { /* skip */ }
            eventType = "";
            dataStr = "";
          }
        }
      }
    } catch {
      setError("网络异常，请重试");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Search className="size-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 选股</h1>
            <p className="text-sm text-muted-foreground">多维度筛选 · AI 智能匹配 · 量化逻辑</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-1 gap-4 min-h-0">
        {/* Left: Filter Panel */}
        <div className="w-80 shrink-0">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Results */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Loading */}
          {isLoading && (
            <Card className="flex flex-col items-center justify-center py-16 gap-4">
              <Sparkles className="size-10 text-primary/50 animate-pulse" />
              <p className="text-sm text-muted-foreground">AI 正在根据你的条件筛选股票...</p>
              <p className="text-xs text-muted-foreground/50">分析基本面 · 技术面 · 资金面 · 行业前景</p>
            </Card>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Card className="flex items-center gap-3 p-4 border-red-500/30 bg-red-500/5">
              <AlertTriangle className="size-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              {/* Summary */}
              {summary && (
                <Card className="mb-3 p-3 border-border/30 bg-muted/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      匹配 {summary.totalMatches as number} 只
                    </Badge>
                    {(summary.screeningLogic as string) && (
                      <span className="text-xs text-muted-foreground">
                        {summary.screeningLogic as string}
                      </span>
                    )}
                  </div>
                </Card>
              )}

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {results.map((r) => (
                  <Card
                    key={r.code}
                    className="p-3 border-border/30 hover:border-primary/20 hover:bg-muted/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Name + Code + Score */}
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={`/stock/${r.code}`}
                            className="text-sm font-semibold hover:text-primary transition-colors"
                          >
                            {r.name}
                          </a>
                          <span className="text-xs text-muted-foreground">{r.code}</span>
                          <Badge
                            className={cn(
                              "text-[10px]",
                              r.matchScore >= 80 && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                              r.matchScore >= 60 && r.matchScore < 80 && "bg-amber-500/15 text-amber-400 border-amber-500/30",
                              r.matchScore < 60 && "bg-muted text-muted-foreground",
                            )}
                          >
                            匹配度 {r.matchScore}%
                          </Badge>
                        </div>

                        {/* Reasons */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {r.reasons.map((reason, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>

                        {/* Key Metrics */}
                        {r.keyMetrics && Object.keys(r.keyMetrics).length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70">
                            {r.keyMetrics.pe !== undefined && (
                              <span>PE: <strong>{String(r.keyMetrics.pe)}</strong></span>
                            )}
                            {r.keyMetrics.roe !== undefined && (
                              <span>ROE: <strong>{String(r.keyMetrics.roe)}%</strong></span>
                            )}
                            {r.keyMetrics.marketCap != null && (
                              <span>市值: <strong>{String(r.keyMetrics.marketCap)}</strong></span>
                            )}
                          </div>
                        )}

                        {/* Risk Note */}
                        {r.riskNote && (
                          <p className="mt-1 text-[10px] text-red-400/60">{r.riskNote}</p>
                        )}
                      </div>

                      <a
                        href={`/stock/${r.code}`}
                        className="shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="size-4 text-primary/50" />
                      </a>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="mt-3 text-center text-[10px] text-muted-foreground/40 shrink-0">
                ⚠️ AI 选股结果仅供参考，不构成投资建议。投资有风险，入市需谨慎。
              </p>
            </>
          )}

          {/* Empty state */}
          {!isLoading && !error && results.length === 0 && (
            <Card className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
              <Search className="size-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">请设置筛选条件后点击「AI 智能选股」</p>
              <p className="text-xs text-muted-foreground/40">支持多维度组合筛选，AI 将基于量化逻辑匹配最佳标的</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
