"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MasterAnalysis } from "@/types/ai";

interface MasterCardProps {
  master: MasterAnalysis;
  isRevealed: boolean;
}

const stanceConfig = {
  bullish: { label: "看多", className: "text-up border-up/30 bg-up/5" },
  bearish: { label: "看空", className: "text-down border-down/30 bg-down/5" },
  neutral: { label: "中性", className: "text-muted-foreground border-muted/30 bg-muted/5" },
};

const avatarColors = [
  "from-blue-500/20 to-blue-600/10",   // 巴菲特
  "from-purple-500/20 to-purple-600/10", // 索罗斯
  "from-green-500/20 to-green-600/10",   // 彼得·林奇
  "from-cyan-500/20 to-cyan-600/10",    // 西蒙斯
  "from-amber-500/20 to-amber-600/10",  // 达利欧
  "from-rose-500/20 to-rose-600/10",    // 格雷厄姆
  "from-red-500/20 to-red-600/10",      // 利弗莫尔
  "from-teal-500/20 to-teal-600/10",    // 罗杰斯
];

export function MasterCard({ master, isRevealed }: MasterCardProps) {
  const stance = stanceConfig[master.stance] || stanceConfig.neutral;
  const avatarBg = avatarColors[(master.order - 1) % avatarColors.length];

  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:border-primary/20">
      {/* Avatar Header */}
      <div className={`relative p-4 bg-gradient-to-br ${avatarBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-background/60 text-lg font-bold ring-1 ring-border/20">
              {master.master[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{master.master}</p>
              <p className="text-xs text-muted-foreground">{master.style}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-medium ${stance.className}`}
          >
            {stance.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">信心度</span>
            <span className="font-mono font-medium">
              {(master.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <Progress
            value={master.confidence * 100}
            className="h-1.5"
            // Color based on stance
          />
        </div>

        {/* Reasoning */}
        {isRevealed ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">分析推理</p>
            <p className="text-xs leading-relaxed text-foreground/80 line-clamp-4">
              {master.reasoning}
            </p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            <div className="h-2.5 w-full rounded bg-muted/30 animate-pulse" />
            <div className="h-2.5 w-3/4 rounded bg-muted/30 animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-muted/30 animate-pulse" />
          </div>
        )}

        {/* Error */}
        {master.error && (
          <p className="text-xs text-red-400">⚠ {master.error}</p>
        )}
      </div>
    </Card>
  );
}
