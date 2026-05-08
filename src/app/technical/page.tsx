"use client";

/**
 * 技术分析页 — K线图 + 多指标叠加 + 形态识别 + 自选股切换
 */
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KlineChart } from "@/components/charts/kline-chart";
import { MinuteChart } from "@/components/charts/minute-chart";
import { TechnicalIndicators } from "@/components/charts/technical-indicators";
import type { KlineItem } from "@/types/market";

const DEFAULT_STOCK = "000001";
const PERIODS = ["daily", "weekly", "monthly"] as const;
type Period = (typeof PERIODS)[number];

export default function TechnicalAnalysisPage() {
  const [stockCode, setStockCode] = useState(DEFAULT_STOCK);
  const [searchInput, setSearchInput] = useState(DEFAULT_STOCK);
  const [period, setPeriod] = useState<Period>("daily");
  const [klineData, setKlineData] = useState<KlineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockName, setStockName] = useState("");

  const fetchKline = useCallback(async (code: string, p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/kline/${code}?period=${p}&limit=250`);
      const json = await res.json();
      const data = json.data || json.results || [];
      setKlineData(data as KlineItem[]);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchStockInfo = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/market/stock/${code}`);
      const json = await res.json();
      const stock = json.data || json;
      setStockName((stock.name as string) || "");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchKline(stockCode, period);
    fetchStockInfo(stockCode);
  }, [stockCode, period, fetchKline, fetchStockInfo]);

  const handleSearch = () => {
    const code = searchInput.trim();
    if (code && code.length >= 5) {
      setStockCode(code);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="size-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">技术分析</h1>
            <p className="text-sm text-muted-foreground">
              {stockName ? `${stockName} (${stockCode})` : stockCode} · K线 + 技术指标
            </p>
          </div>
        </div>

        {/* Stock search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="股票代码"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-32 h-8 text-xs"
          />
          <Button size="sm" className="h-8" onClick={handleSearch}>
            <Search className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="mt-3 shrink-0">
        <TabsList className="h-8">
          {PERIODS.map((p) => (
            <TabsTrigger key={p} value={p} className="text-xs h-7 px-3 capitalize">
              {p === "daily" ? "日K" : p === "weekly" ? "周K" : "月K"}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Charts area */}
      <div className="mt-3 flex-1 flex flex-col gap-3 min-h-0">
        {/* Kline chart */}
        <div className="flex-1 min-h-[300px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground/30" />
            </div>
          ) : (
            <KlineChart data={klineData} period={period} />
          )}
        </div>

        {/* Technical Indicators */}
        {klineData.length > 0 && (
          <div className="shrink-0">
            <TechnicalIndicators data={klineData} />
          </div>
        )}
      </div>
    </div>
  );
}
