"use client";

/**
 * ChainOfThought — AI 思考链可视化组件
 * 展示投资委员会分析过程中每个步骤的状态和内容
 */
import { Check, Loader2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface ChainStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  detail?: string;
}

interface ChainOfThoughtProps {
  steps: ChainStep[];
  className?: string;
}

const statusIcon = {
  pending: <Circle className="size-4 text-muted-foreground/40" />,
  active: <Loader2 className="size-4 animate-spin text-primary" />,
  completed: <Check className="size-4 text-up" />,
  error: <AlertCircle className="size-4 text-down" />,
};

export function ChainOfThought({ steps, className }: ChainOfThoughtProps) {
  if (!steps.length) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isActive = step.status === "active";
        const isCompleted = step.status === "completed";

        return (
          <div key={step.id} className="relative flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border transition-colors",
                  isActive && "border-primary bg-primary/10",
                  isCompleted && "border-up/30 bg-up/5",
                  step.status === "error" && "border-down/30 bg-down/5",
                  step.status === "pending" && "border-muted/30 bg-transparent",
                )}
              >
                {statusIcon[step.status]}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-px flex-1 min-h-[12px]",
                    isCompleted
                      ? "bg-up/30"
                      : isActive
                        ? "bg-primary/20"
                        : "bg-muted/20",
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-3 pt-0.5 flex-1">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive && "text-primary",
                  isCompleted && "text-foreground/80",
                  step.status === "pending" && "text-muted-foreground/50",
                  step.status === "error" && "text-down",
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p
                  className={cn(
                    "text-xs transition-colors",
                    step.status === "pending"
                      ? "text-muted-foreground/40"
                      : "text-muted-foreground",
                  )}
                >
                  {step.description}
                </p>
              )}
              {step.detail && isActive && (
                <p className="mt-1 text-xs text-muted-foreground animate-pulse">
                  {step.detail}
                </p>
              )}
              {step.detail && isCompleted && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 预定义的投资委员会分析步骤
 */
export const COMMITTEE_STEPS: ChainStep[] = [
  {
    id: "data",
    label: "数据加载",
    description: "获取实时行情、基本面与技术指标数据",
    status: "pending",
  },
  {
    id: "masters",
    label: "大师分析",
    description: "8位AI投资大师独立分析并给出观点",
    status: "pending",
  },
  {
    id: "debate",
    label: "辩论交锋",
    description: "看多方与看空方正面对决，深度剖析分歧",
    status: "pending",
  },
  {
    id: "risk",
    label: "风险评估",
    description: "风控委员会综合评估投资风险等级",
    status: "pending",
  },
  {
    id: "chairman",
    label: "主席总结",
    description: "投委会主席综合各方意见，给出最终判断",
    status: "pending",
  },
];
