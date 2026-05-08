"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TickerItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Static fallback data — will be replaced with real API in T08
const FALLBACK_INDICES: TickerItem[] = [
  { code: "000001", name: "上证综指", price: 3247.82, change: 18.56, changePercent: 0.58 },
  { code: "399001", name: "深证成指", price: 11034.55, change: 135.22, changePercent: 1.24 },
  { code: "399006", name: "创业板指", price: 2156.33, change: -6.89, changePercent: -0.32 },
  { code: "000300", name: "沪深300", price: 3891.45, change: 15.93, changePercent: 0.41 },
  { code: "000688", name: "科创50", price: 876.52, change: -2.34, changePercent: -0.27 },
  { code: "000852", name: "中证1000", price: 5432.18, change: 28.67, changePercent: 0.53 },
];

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK_INDICES);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"}/api/v1/market/indices`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
          setLastUpdate(new Date());
        }
      }
    } catch {
      // Keep fallback data on error
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [fetchIndices]);

  return (
    <div className="flex h-8 items-center gap-0.5 border-t border-border bg-sidebar px-0.5 overflow-hidden">
      {items.map((item, i) => (
        <div
          key={item.code}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-xs tabular-nums",
            i > 0 && "border-l border-border/50"
          )}
        >
          <span className="font-medium text-muted-foreground">{item.name}</span>
          <span className="font-semibold text-foreground">
            {item.price.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              item.changePercent > 0 ? "text-up" : item.changePercent < 0 ? "text-down" : "text-muted-foreground"
            )}
          >
            {item.changePercent > 0 ? (
              <TrendingUp className="size-3" />
            ) : item.changePercent < 0 ? (
              <TrendingDown className="size-3" />
            ) : (
              <Minus className="size-3" />
            )}
            {item.changePercent > 0 ? "+" : ""}
            {item.changePercent.toFixed(2)}%
          </span>
        </div>
      ))}
      {/* Data freshness indicator */}
      <div className="ml-auto shrink-0 border-l border-border/50 px-2 text-[10px] text-muted-foreground">
        更新 {lastUpdate.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  );
}
