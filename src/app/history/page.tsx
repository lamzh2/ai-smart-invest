"use client";

/**
 * 分析历史页 — 过往 AI 分析记录（投资委员会 + Deep Research）
 */
import { useState, useEffect } from "react";
import { History, Clock, Search, Filter, ExternalLink, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  type: "committee" | "deep-research";
  title: string;
  stockCode?: string;
  summary: string;
  recommendation?: string;
  confidence?: number;
  createdAt: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "h1", type: "committee", title: "贵州茅台投资委员会分析",
    stockCode: "600519", summary: "8位大师综合评估：强烈买入，置信度82%",
    recommendation: "strong_buy", confidence: 82, createdAt: "2026-05-08 14:30",
  },
  {
    id: "h2", type: "deep-research", title: "新能源板块估值分析",
    summary: "完成4步深度调研，生成8000字行业报告，覆盖光伏/锂电/风电三大赛道",
    createdAt: "2026-05-08 10:15",
  },
  {
    id: "h3", type: "committee", title: "宁德时代投资委员会分析",
    stockCode: "300750", summary: "8位大师综合评估：买入，置信度75%",
    recommendation: "buy", confidence: 75, createdAt: "2026-05-07 16:00",
  },
  {
    id: "h4", type: "committee", title: "五粮液投资委员会分析",
    stockCode: "000858", summary: "8位大师综合评估：持有，置信度68%",
    recommendation: "hold", confidence: 68, createdAt: "2026-05-06 11:20",
  },
  {
    id: "h5", type: "deep-research", title: "AI产业链投资机会",
    summary: "梳理A股AI产业链核心标的，算力/大模型/应用层三条主线",
    createdAt: "2026-05-05 09:00",
  },
];

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>(MOCK_HISTORY);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "committee" | "deep-research">("all");

  const filtered = items.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (search && !item.title.includes(search) && !item.summary.includes(search)) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
          <History className="size-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">分析历史</h1>
          <p className="text-sm text-muted-foreground">投资委员会 + Deep Research 记录</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mt-4 shrink-0">
        <Input
          placeholder="搜索历史记录..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-8 text-xs"
        />
        <div className="flex gap-1">
          {(["all", "committee", "deep-research"] as const).map((f) => (
            <Badge
              key={f}
              variant={filter === f ? "default" : "outline"}
              className="cursor-pointer text-[10px] h-6"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "全部" : f === "committee" ? "投资委员会" : "深度调研"}
            </Badge>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2">
        {filtered.map((item) => (
          <Card key={item.id} className="p-3 border-border/30 hover:border-primary/20 hover:bg-muted/5 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      item.type === "committee" && "border-amber-500/30 text-amber-400",
                      item.type === "deep-research" && "border-emerald-500/30 text-emerald-400",
                    )}
                  >
                    {item.type === "committee" ? "投资委员会" : "Deep Research"}
                  </Badge>
                  {item.stockCode && (
                    <span className="text-xs text-muted-foreground">{item.stockCode}</span>
                  )}
                  {item.recommendation && (
                    <Badge
                      className={cn(
                        "text-[10px]",
                        item.recommendation === "strong_buy" && "bg-emerald-500/15 text-emerald-400",
                        item.recommendation === "buy" && "bg-emerald-500/10 text-emerald-400/70",
                        item.recommendation === "hold" && "bg-amber-500/10 text-amber-400",
                        item.recommendation === "sell" && "bg-red-500/10 text-red-400",
                      )}
                    >
                      {item.recommendation === "strong_buy" ? "强烈买入" :
                       item.recommendation === "buy" ? "买入" :
                       item.recommendation === "hold" ? "持有" : "卖出"}
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.summary}</p>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <div className="text-right">
                  {item.confidence && (
                    <p className="text-xs font-medium text-primary">{item.confidence}%</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                    <Clock className="size-2.5" />
                    {item.createdAt}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <History className="size-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">暂无历史记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
