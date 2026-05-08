"use client";

/**
 * ProgressTracker — 4 步 Deep Research 流程可视化
 * Step 1: 制定计划 → Step 2: 数据收集 → Step 3: 反思分析 → Step 4: 撰写报告
 */
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Search,
  Database,
  Brain,
  FileText,
} from "lucide-react";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface ResearchStep {
  id: number;
  label: string;
  status: StepStatus;
  message?: string;
}

const STEP_ICONS = [Search, Database, Brain, FileText];

interface ProgressTrackerProps {
  steps: ResearchStep[];
  className?: string;
}

export function ProgressTracker({ steps, className }: ProgressTrackerProps) {
  return (
    <div className={cn("flex items-stretch", className)}>
      {steps.map((step, idx) => {
        const Icon = STEP_ICONS[idx] || Circle;
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.id} className="flex flex-1 items-start">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                  step.status === "completed" && "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                  step.status === "active" && "border-primary bg-primary/10 text-primary animate-pulse",
                  step.status === "error" && "border-red-500 bg-red-500/10 text-red-400",
                  step.status === "pending" && "border-border/40 text-muted-foreground/40",
                )}
              >
                {step.status === "completed" && <CheckCircle2 className="size-5" />}
                {step.status === "active" && <Loader2 className="size-5 animate-spin" />}
                {step.status === "error" && <AlertCircle className="size-5" />}
                {step.status === "pending" && <Icon className="size-4" />}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[11px] font-medium text-center leading-tight max-w-[80px]",
                  step.status === "completed" && "text-emerald-400",
                  step.status === "active" && "text-primary",
                  step.status === "error" && "text-red-400",
                  step.status === "pending" && "text-muted-foreground/40",
                )}
              >
                {step.label}
              </span>
              {step.message && (
                <span className="mt-0.5 text-[10px] text-muted-foreground/60 text-center leading-tight max-w-[90px]">
                  {step.message}
                </span>
              )}
            </div>
            {!isLast && (
              <div className="relative mt-5 flex-1 h-0.5 -ml-0.5 mr-0.5">
                <div className="absolute inset-0 bg-border/30 rounded-full" />
                <div
                  className={cn(
                    "absolute inset-0 bg-primary/50 rounded-full origin-left transition-transform duration-700",
                    step.status === "completed" ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function buildSteps(
  currentStep: number,
  stepMessages: Record<number, string>,
): ResearchStep[] {
  const labels = ["制定计划", "数据收集", "反思分析", "撰写报告"];
  return [1, 2, 3, 4].map((id) => {
    let status: StepStatus = "pending";
    if (id < currentStep) status = "completed";
    else if (id === currentStep) status = "active";
    return { id, label: labels[id - 1], status, message: stepMessages[id] };
  });
}
