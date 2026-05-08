"use client";

/**
 * CommitteeFlow — 投资委员会5阶段分析流程可视化
 * 数据加载 → 大师分析 → 辩论交锋 → 风险评估 → 主席总结
 */
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, Users, Swords, Shield, Gavel, Check, Loader2, AlertCircle } from "lucide-react";
import type { CommitteePhase } from "@/types/ai";

interface CommitteeFlowProps {
  phase: CommitteePhase;
  progress: number;
  className?: string;
}

const PHASES: {
  id: CommitteePhase;
  label: string;
  icon: typeof Database;
  description: string;
}[] = [
  { id: "loading", label: "数据加载", icon: Database, description: "获取实时行情与基本面数据" },
  { id: "masters", label: "大师分析", icon: Users, description: "8位AI投资大师独立研判" },
  { id: "debating", label: "辩论交锋", icon: Swords, description: "看多方与看空方正面对决" },
  { id: "risk", label: "风险评估", icon: Shield, description: "风控委员会综合评估" },
  { id: "chairman", label: "主席总结", icon: Gavel, description: "投委会主席最终判断" },
];

const phaseOrder: CommitteePhase[] = ["idle", "loading", "masters", "debating", "risk", "chairman", "done", "error"];

function getPhaseIndex(phase: CommitteePhase): number {
  const idx = phaseOrder.indexOf(phase);
  return idx >= 0 ? idx : -1;
}

export function CommitteeFlow({ phase, progress, className }: CommitteeFlowProps) {
  if (phase === "idle") return null;

  const currentIdx = getPhaseIndex(phase);
  const isError = phase === "error";
  const isDone = phase === "done";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isError ? "分析异常" : isDone ? "分析完成" : "分析中..."}
          </span>
          <span className="font-mono tabular-nums text-muted-foreground">
            {isDone ? 100 : Math.round(progress * 100)}%
          </span>
        </div>
        <Progress
          value={isDone ? 100 : progress * 100}
          className={cn("h-2", isError && "[&>div]:bg-down")}
        />
      </div>

      {/* Phase Indicators */}
      <div className="flex items-center justify-between gap-1">
        {PHASES.map((p, idx) => {
          const phaseIdx = getPhaseIndex(p.id);
          const isCurrent = phaseIdx === currentIdx;
          const isPast = phaseIdx < currentIdx && phaseIdx >= 0;
          const isFuture = phaseIdx > currentIdx || phaseIdx < 0;

          return (
            <div key={p.id} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Connector line (not for first item) */}
              {idx > 0 && (
                <div className="hidden sm:block absolute -translate-x-1/2">
                  {/* Handled by parent flex */}
                </div>
              )}

              {/* Icon circle */}
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                  isPast && "border-up/50 bg-up/10 text-up",
                  isCurrent && "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20",
                  isFuture && "border-muted/30 bg-transparent text-muted-foreground/30",
                  (isDone || isError) && idx === PHASES.length - 1 && isError
                    ? "border-down/50 bg-down/10 text-down"
                    : "",
                )}
              >
                {isPast ? (
                  <Check className="size-4" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isError && idx === currentIdx - 1 ? (
                  <AlertCircle className="size-4 text-down" />
                ) : (
                  <p.icon className="size-3.5" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight text-center hidden sm:block",
                  isPast && "text-up/70",
                  isCurrent && "text-primary",
                  isFuture && "text-muted-foreground/30",
                )}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Phase Badge */}
      <div className="flex items-center justify-center gap-2">
        {isError ? (
          <Badge variant="outline" className="text-down border-down/30">
            <AlertCircle className="mr-1 size-3" />
            分析失败，请重试
          </Badge>
        ) : isDone ? (
          <Badge variant="outline" className="text-up border-up/30">
            <Check className="mr-1 size-3" />
            分析完成
          </Badge>
        ) : (
          <Badge variant="outline" className="text-primary border-primary/30">
            <Loader2 className="mr-1 size-3 animate-spin" />
            {PHASES.find((p) => phaseOrder.indexOf(p.id) === currentIdx)?.description || "处理中..."}
          </Badge>
        )}
      </div>
    </div>
  );
}
