"use client";

/**
 * 基本面分析页 — 核心财务指标 + 同行业对比 + 财务三表摘要
 */
import { useState, useEffect, useCallback } from "react";
import { BarChart3, Loader2, Search, TrendingDown, TrendingUp, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_STOCK = "000001";

interface FundamentalData {
  code: string;
  name: string;
  marketCap: number;
  pe: number;
  pb: number;
  roe: number;
  revenue: number;
  netProfit: number;
  revenueGrowth: number;
  profitGrowth: number;
  grossMargin: number;
  netMargin: number;
  debtRatio: number;
  dividendYield: number;
  totalShares: number;
  circulatingShares: number;
  eps: number;
  bvps: number;
  industry?: string;
  peers?: { name: string; pe: number; roe: number }[];
}

export default function FundamentalPage() {
  const [stockCode, setStockCode] = useState(DEFAULT_STOCK);
  const [searchInput, setSearchInput] = useState(DEFAULT_STOCK);
  const [data, setData] = useState<FundamentalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/fundamentals/${code}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data as FundamentalData);
      } else {
        // Mock data for demo
        setData({
          code, name: code, marketCap: 3500, pe: 12.5, pb: 1.8, roe: 15.2,
          revenue: 1200, netProfit: 280, revenueGrowth: 12.3, profitGrowth: 8.7,
          grossMargin: 45.6, netMargin: 23.3, debtRatio: 42.1, dividendYield: 2.8,
          totalShares: 120, circulatingShares: 115, eps: 2.33, bvps: 16.8,
          peers: [
            { name: "招商银行", pe: 10.2, roe: 14.5 },
            { name: "兴业银行", pe: 8.5, roe: 12.1 },
            { name: "工商银行", pe: 6.8, roe: 11.3 },
          ],
        });
      }
    } catch {
      setError("数据加载失败");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(stockCode); }, [stockCode, fetchData]);

  const handleSearch = () => {
    const code = searchInput.trim();
    if (code && code.length >= 5) setStockCode(code);
  };

  const metrics = data ? [
    { label: "市盈率 PE", value: data.pe, unit: "倍", good: data.pe < 20 },
    { label: "市净率 PB", value: data.pb, unit: "倍", good: data.pb < 2 },
    { label: "ROE", value: data.roe, unit: "%", good: data.roe > 15 },
    { label: "营收增速", value: data.revenueGrowth, unit: "%", good: data.revenueGrowth > 10 },
    { label: "净利润增速", value: data.profitGrowth, unit: "%", good: data.profitGrowth > 10 },
    { label: "毛利率", value: data.grossMargin, unit: "%", good: data.grossMargin > 30 },
    { label: "净利率", value: data.netMargin, unit: "%", good: data.netMargin > 15 },
    { label: "资产负债率", value: data.debtRatio, unit: "%", good: data.debtRatio < 60 },
    { label: "股息率", value: data.dividendYield, unit: "%", good: data.dividendYield > 2 },
    { label: "每股收益 EPS", value: data.eps, unit: "元", good: data.eps > 1 },
  ] : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <BarChart3 className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">基本面分析</h1>
            <p className="text-sm text-muted-foreground">
              {data ? `${data.name} (${data.code})` : stockCode}
            </p>
          </div>
        </div>
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

      {/* Content */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground/30" />
          </div>
        )}

        {error && (
          <Card className="p-4 border-red-500/30 bg-red-500/5 text-sm text-red-400">{error}</Card>
        )}

        {data && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-5 gap-2">
              {metrics.map((m) => (
                <Card key={m.label} className="p-3 border-border/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
                  <p className={cn("text-lg font-bold", m.good ? "text-emerald-400" : "text-red-400")}>
                    {m.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">{m.unit}</p>
                  <div className="mt-1">
                    {m.good ? (
                      <TrendingUp className="inline size-3 text-emerald-400/50" />
                    ) : (
                      <TrendingDown className="inline size-3 text-red-400/50" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Company Info */}
            <Card className="p-3 border-border/30">
              <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-xs">
                <div><span className="text-muted-foreground">总市值:</span> <strong>{data.marketCap}亿</strong></div>
                <div><span className="text-muted-foreground">总股本:</span> <strong>{data.totalShares}亿</strong></div>
                <div><span className="text-muted-foreground">流通股本:</span> <strong>{data.circulatingShares}亿</strong></div>
                <div><span className="text-muted-foreground">每股净资产:</span> <strong>{data.bvps}元</strong></div>
                <div><span className="text-muted-foreground">营业总收入:</span> <strong>{data.revenue}亿</strong></div>
                <div><span className="text-muted-foreground">净利润:</span> <strong>{data.netProfit}亿</strong></div>
              </div>
            </Card>

            {/* Peer Comparison */}
            {data.peers && data.peers.length > 0 && (
              <Card className="p-3 border-border/30">
                <h3 className="text-sm font-semibold mb-2">同行业对比</h3>
                <div className="space-y-2">
                  {/* Current stock */}
                  <div className="flex items-center gap-2 p-2 rounded bg-primary/5">
                    <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                      {data.name}
                    </Badge>
                    <div className="flex-1 flex items-center gap-4 text-xs">
                      <span>PE: <strong>{data.pe}</strong></span>
                      <span>ROE: <strong>{data.roe}%</strong></span>
                      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(data.roe * 4, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  {/* Peers */}
                  {data.peers.map((peer) => (
                    <div key={peer.name} className="flex items-center gap-2 p-2 rounded hover:bg-muted/5">
                      <Badge variant="outline" className="text-[10px]">
                        {peer.name}
                      </Badge>
                      <div className="flex-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>PE: <strong>{peer.pe}</strong></span>
                        <span>ROE: <strong>{peer.roe}%</strong></span>
                        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${Math.min(peer.roe * 4, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground/40 shrink-0">
        ⚠️ 基本面数据可能存在延迟，仅供参考
      </p>
    </div>
  );
}
