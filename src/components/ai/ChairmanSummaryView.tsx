"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ChairmanSummary } from "@/types/ai";

interface ChairmanSummaryViewProps {
  summary: ChairmanSummary | null;
  isLoading?: boolean;
}

const recommendationConfig = {
  strong_buy: { label: "强烈买入", className: "bg-up/20 text-up border-up/30" },
  buy: { label: "买入", className: "bg-up/10 text-up border-up/20" },
  hold: { label: "持有", className: "bg-muted/20 text-muted-foreground border-muted/30" },
  sell: { label: "卖出", className: "bg-down/10 text-down border-down/20" },
  strong_sell: { label: "强烈卖出", className: "bg-down/20 text-down border-down/30" },
};

export function ChairmanSummaryView({
  summary,
  isLoading,
}: ChairmanSummaryViewProps) {
  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-muted/30 animate-pulse" />
        <div className="h-4 w-full rounded bg-muted/20 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-muted/20 animate-pulse" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full rounded bg-muted/20 animate-pulse" />
          <div className="h-3 w-full rounded bg-muted/20 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-muted/20 animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const rec = recommendationConfig[summary.recommendation] || recommendationConfig.hold;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-primary/10 bg-primary/5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              投委会主席综合判断
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={`text-sm font-bold px-3 py-1 ${rec.className}`}>
                {rec.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                置信度{" "}
                <span className="font-mono font-bold text-foreground">
                  {(summary.confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          </div>

          {/* Confidence radial */}
          <div className="relative flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle
                cx="28" cy="28" r="24"
                fill="none" stroke="currentColor"
                strokeWidth="4" opacity={0.1}
              />
              <circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke={
                  summary.confidence >= 0.7
                    ? "#00c853"
                    : summary.confidence >= 0.4
                    ? "#f59e0b"
                    : "#ff5252"
                }
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${summary.confidence * 150} 150`}
                transform="rotate(-90 28 28)"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-xs font-bold font-mono">
              {(summary.confidence * 100).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Summary */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            综合摘要
          </p>
          <p className="text-sm leading-relaxed">{summary.summary}</p>
        </div>

        {/* Key Points */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              关键要点
            </p>
            <ul className="space-y-1.5">
              {summary.keyPoints.map((p, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1 text-xs">●</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Masters Alignment */}
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.bullishMasters && summary.bullishMasters.length > 0 && (
            <div className="rounded-md bg-up/5 border border-up/10 p-3">
              <p className="text-xs font-medium text-up mb-1.5">
                🟢 看多大佬 ({summary.bullishMasters.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {summary.bullishMasters.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="text-xs bg-up/5 border-up/20 text-up"
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {summary.bearishMasters && summary.bearishMasters.length > 0 && (
            <div className="rounded-md bg-down/5 border border-down/10 p-3">
              <p className="text-xs font-medium text-down mb-1.5">
                🔴 看空大佬 ({summary.bearishMasters.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {summary.bearishMasters.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="text-xs bg-down/5 border-down/20 text-down"
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Items */}
        {summary.actionItems && summary.actionItems.length > 0 && (
          <div className="rounded-md border border-border/40 bg-muted/10 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              📋 行动建议
            </p>
            <ul className="space-y-1">
              {summary.actionItems.map((a, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <span className="text-muted-foreground">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
