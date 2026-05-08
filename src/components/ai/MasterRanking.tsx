"use client";

/**
 * MasterRanking — 大师排行榜表格 + 雷达图指标
 */
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MasterRank } from "@/types/ai";

interface MasterRankingProps {
  rankings: MasterRank[];
  className?: string;
}

export function MasterRanking({ rankings, className }: MasterRankingProps) {
  if (!rankings.length) return null;

  const sorted = [...rankings].sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((master, idx) => (
        <Card
          key={master.master}
          className="p-3 border-border/30 hover:border-primary/20 hover:bg-muted/5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                  idx === 0 && "bg-amber-500/20 text-amber-400",
                  idx === 1 && "bg-slate-400/20 text-slate-300",
                  idx === 2 && "bg-orange-700/20 text-orange-400",
                  idx > 2 && "bg-muted/30 text-muted-foreground",
                )}
              >
                {idx + 1}
              </div>

              {/* Avatar + Name */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{master.master}</span>
                  <span className="text-2xl">{master.avatar}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    className={cn(
                      "text-[10px]",
                      master.accuracy >= 70 && "bg-emerald-500/15 text-emerald-400",
                      master.accuracy >= 50 && master.accuracy < 70 && "bg-amber-500/15 text-amber-400",
                      master.accuracy < 50 && "bg-red-500/15 text-red-400",
                    )}
                  >
                    准确率 {master.accuracy}%
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {master.totalCalls} 次 | 均收益 +{master.avgReturn}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: specialties + best call */}
            <div className="text-right">
              <div className="flex flex-wrap justify-end gap-1 mb-1">
                {master.specialty.map((s) => (
                  <span
                    key={s}
                    className="text-[9px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                最佳: {master.bestCall.stock} <span className="text-emerald-400">+{master.bestCall.return}%</span>
              </p>
            </div>
          </div>

          {/* Recent performance bar */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/50 shrink-0">近期</span>
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  master.accuracy >= 70 && "bg-emerald-500/60",
                  master.accuracy >= 50 && master.accuracy < 70 && "bg-amber-500/60",
                  master.accuracy < 50 && "bg-red-500/60",
                )}
                style={{ width: `${master.accuracy}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground/50">{master.recentPerformance}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
