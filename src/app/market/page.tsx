"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpot } from "@/hooks/use-market-data";
import type { StockSpot } from "@/types/market";

type SortField = "change_percent" | "price" | "volume" | "turnover" | "pe" | "change_60d";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortField; label: string; width: string; align: "left" | "right" }[] = [
  { key: "change_percent", label: "涨跌幅", width: "w-[80px]", align: "right" },
  { key: "price", label: "最新价", width: "w-[90px]", align: "right" },
  { key: "volume", label: "成交量", width: "w-[100px]", align: "right" },
  { key: "turnover", label: "成交额", width: "w-[100px]", align: "right" },
  { key: "pe", label: "市盈率", width: "w-[80px]", align: "right" },
  { key: "change_60d", label: "60日涨跌", width: "w-[85px]", align: "right" },
];

function formatVolume(n: number): string {
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "万";
  return String(n);
}

function formatTurnover(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "万亿";
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "亿";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "万";
  return String(n);
}

export default function MarketPage() {
  const router = useRouter();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [sortField, setSortField] = useState<SortField>("change_percent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: spotData, isLoading } = useSpot(1, 5000, sortField, sortDir);
  const stocks = spotData?.data ?? [];

  // Filter by search
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return stocks;
    const q = debouncedSearch.toLowerCase();
    return stocks.filter(
      (s) =>
        s.code.includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stocks, debouncedSearch]);

  // Sort (client-side secondary sort by code for stability)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      const diff = Number(aVal) - Number(bVal);
      return sortDir === "desc" ? -diff : diff;
    });
  }, [filtered, sortField, sortDir]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  // Market breadth stats
  const upCount = useMemo(() => stocks.filter((s) => s.change_percent > 0).length, [stocks]);
  const downCount = useMemo(() => stocks.filter((s) => s.change_percent < 0).length, [stocks]);

  // Scroll to top on sort change
  const handleSort = (field: SortField) => {
    toggleSort(field);
    virtuosoRef.current?.scrollToIndex(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 size-3 opacity-40" />;
    return sortDir === "desc" ? (
      <ArrowDown className="ml-1 size-3" />
    ) : (
      <ArrowUp className="ml-1 size-3" />
    );
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">实时行情</h1>
        <p className="text-sm text-muted-foreground">
          全市场 A 股实时行情 · 共 {stocks.length.toLocaleString()} 只标的
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="outline" className="text-up border-up/30">
          上涨 {upCount}
        </Badge>
        <Badge variant="outline" className="text-down border-down/30">
          下跌 {downCount}
        </Badge>
        <Badge variant="outline">
          平盘 {stocks.length - upCount - downCount}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索股票代码或名称... (⌘K)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table Header */}
      <div className="flex items-center border-b border-border px-1 pb-2 text-xs font-medium text-muted-foreground">
        <div className="w-[90px] shrink-0">代码</div>
        <div className="flex-1">名称</div>
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={`${col.width} flex shrink-0 items-center hover:text-foreground transition-colors ${
              col.align === "right" ? "justify-end" : "justify-start"
            }`}
          >
            {col.label}
            <SortIcon field={col.key} />
          </button>
        ))}
      </div>

      {/* Virtual List */}
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex-1">
          <Virtuoso
            ref={virtuosoRef}
            data={sorted}
            totalCount={sorted.length}
            itemContent={(_, stock) => <StockRow stock={stock} onClick={() => router.push(`/stock/${stock.code}`)} />}
            overscan={200}
            style={{ height: "calc(100vh - 280px)" }}
          />
        </div>
      )}
    </div>
  );
}

function StockRow({ stock, onClick }: { stock: StockSpot; onClick: () => void }) {
  const isUp = stock.change_percent > 0;
  const isNeutral = stock.change_percent === 0;
  const colorClass = isUp ? "text-up" : isNeutral ? "" : "text-down";

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center border-b border-border/50 px-1 py-2.5 text-sm hover:bg-accent/40 transition-colors"
    >
      {/* Code */}
      <div className="w-[90px] shrink-0 font-mono text-xs tabular-nums">
        {stock.code}
      </div>

      {/* Name */}
      <div className="flex-1 truncate pr-2 font-medium">{stock.name}</div>

      {/* Change % */}
      <div className={`w-[80px] shrink-0 text-right font-semibold tabular-nums ${colorClass}`}>
        {stock.change_percent > 0 ? "+" : ""}
        {stock.change_percent.toFixed(2)}%
      </div>

      {/* Price */}
      <div className={`w-[90px] shrink-0 text-right tabular-nums ${colorClass}`}>
        {stock.price.toFixed(2)}
      </div>

      {/* Volume */}
      <div className="w-[100px] shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {formatVolume(stock.volume)}
      </div>

      {/* Turnover */}
      <div className="w-[100px] shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {stock.turnover ? formatTurnover(stock.turnover) : "-"}
      </div>

      {/* PE */}
      <div className="w-[80px] shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {stock.pe ? stock.pe.toFixed(1) : "-"}
      </div>

      {/* 60d change */}
      <div
        className={`w-[85px] shrink-0 text-right text-xs tabular-nums ${
          (stock.change_60d ?? 0) > 0 ? "text-up" : (stock.change_60d ?? 0) < 0 ? "text-down" : "text-muted-foreground"
        }`}
      >
        {stock.change_60d != null
          ? `${stock.change_60d > 0 ? "+" : ""}${stock.change_60d.toFixed(1)}%`
          : "-"}
      </div>
    </div>
  );
}
