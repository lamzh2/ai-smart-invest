"use client";

/**
 * ConfidenceGauge — 置信度仪表盘组件
 * 环形/半环形进度条展示 AI 分析的置信度
 */
import { cn } from "@/lib/utils";

interface ConfidenceGaugeProps {
  value: number; // 0-1
  size?: "sm" | "md" | "lg";
  label?: string;
  showPercentage?: boolean;
  className?: string;
  animated?: boolean;
}

const sizeConfig = {
  sm: { dimension: 48, stroke: 5, fontSize: "text-xs", labelSize: "text-[10px]" },
  md: { dimension: 72, stroke: 6, fontSize: "text-lg", labelSize: "text-xs" },
  lg: { dimension: 120, stroke: 8, fontSize: "text-3xl", labelSize: "text-sm" },
};

function getColor(value: number): string {
  if (value >= 0.8) return "#00c853";
  if (value >= 0.6) return "#64dd17";
  if (value >= 0.4) return "#f59e0b";
  if (value >= 0.2) return "#f97316";
  return "#ff5252";
}

function getColorClassName(value: number): string {
  if (value >= 0.8) return "text-up";
  if (value >= 0.6) return "text-green-400";
  if (value >= 0.4) return "text-amber-400";
  if (value >= 0.2) return "text-orange-400";
  return "text-down";
}

export function ConfidenceGauge({
  value,
  size = "md",
  label,
  showPercentage = true,
  className,
  animated = true,
}: ConfidenceGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.dimension - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - Math.min(Math.max(value, 0), 1));
  const color = getColor(value);
  const colorClass = getColorClassName(value);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative inline-flex items-center justify-center">
        {/* Background circle */}
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="-rotate-90"
        >
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-muted/20"
          />
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className={animated ? "transition-all duration-1000 ease-out" : ""}
          />
        </svg>

        {/* Center text */}
        {showPercentage && (
          <span
            className={cn(
              "absolute font-mono font-bold tabular-nums",
              config.fontSize,
              colorClass,
            )}
          >
            {(value * 100).toFixed(0)}
          </span>
        )}
      </div>

      {label && (
        <span
          className={cn("text-muted-foreground", config.labelSize)}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * 多指标仪表盘面板 — 用于展示多个置信度指标
 */
interface GaugeMetric {
  label: string;
  value: number; // 0-1
}

interface ConfidencePanelProps {
  metrics: GaugeMetric[];
  title?: string;
  className?: string;
}

export function ConfidencePanel({
  metrics,
  title,
  className,
}: ConfidencePanelProps) {
  if (!metrics.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {metrics.map((m) => (
          <ConfidenceGauge
            key={m.label}
            value={m.value}
            size="sm"
            label={m.label}
          />
        ))}
      </div>
    </div>
  );
}
