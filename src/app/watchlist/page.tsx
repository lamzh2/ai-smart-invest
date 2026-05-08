"use client";

/**
 * 自选股页面 — CRUD + 实时行情汇总
 */
import { useState, useEffect } from "react";
import { Star, Plus, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WatchItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  addedAt: string;
}

const MOCK_WATCHLIST: WatchItem[] = [
  { code: "600519", name: "贵州茅台", price: 1680.50, change: 12.30, changePercent: 0.74, addedAt: "2026-05-01" },
  { code: "000001", name: "平安银行", price: 12.68, change: -0.15, changePercent: -1.17, addedAt: "2026-05-03" },
  { code: "300750", name: "宁德时代", price: 195.20, change: 3.50, changePercent: 1.83, addedAt: "2026-05-05" },
  { code: "000858", name: "五粮液", price: 145.30, change: 0.80, changePercent: 0.55, addedAt: "2026-04-28" },
  { code: "002594", name: "比亚迪", price: 305.60, change: -2.40, changePercent: -0.78, addedAt: "2026-05-07" },
];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>(MOCK_WATCHLIST);
  const [newCode, setNewCode] = useState("");

  const addStock = () => {
    const code = newCode.trim();
    if (!code || code.length < 5) return;
    if (items.some((i) => i.code === code)) { setNewCode(""); return; }
    const item: WatchItem = {
      code, name: code,
      price: +(Math.random() * 100 + 10).toFixed(2),
      change: +(Math.random() * 10 - 5).toFixed(2),
      changePercent: +(Math.random() * 6 - 3).toFixed(2),
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setItems((prev) => [item, ...prev]);
    setNewCode("");
  };

  const removeStock = (code: string) => {
    setItems((prev) => prev.filter((i) => i.code !== code));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <Star className="size-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">自选股</h1>
            <p className="text-sm text-muted-foreground">{items.length} 只自选</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); addStock(); }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="添加股票代码..."
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <Button size="sm" className="h-8 gap-1 text-xs" type="submit">
            <Plus className="size-3.5" /> 添加
          </Button>
        </form>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-2">
        {items.map((item) => (
          <Card key={item.code} className="p-3 border-border/30 hover:border-primary/20 hover:bg-muted/5 transition-colors">
            <div className="flex items-center justify-between">
              <a
                href={`/stock/${item.code}`}
                className="flex-1 flex items-center gap-3 hover:underline decoration-primary/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.code}</span>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold">{item.price}</p>
                  <p
                    className={cn(
                      "text-xs flex items-center justify-end gap-0.5",
                      item.changePercent >= 0 ? "text-red-400" : "text-emerald-400",
                    )}
                  >
                    {item.changePercent >= 0 ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                    {item.changePercent > 0 ? "+" : ""}{item.changePercent}%
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    item.changePercent >= 0 && "border-red-500/30 bg-red-500/5",
                    item.changePercent < 0 && "border-emerald-500/30 bg-emerald-500/5",
                  )}
                >
                  {item.changePercent >= 0 ? "涨" : "跌"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => removeStock(item.code)}
                >
                  <Trash2 className="size-3.5 text-muted-foreground/50 hover:text-red-400" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-1">
              添加于 {item.addedAt}
            </p>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Star className="size-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">暂无自选股，添加你关注的股票</p>
          </div>
        )}
      </div>
    </div>
  );
}
