"use client";

import type { RiskAssessment } from "@/types/ai";

interface RiskBadgeProps {
  risk: RiskAssessment | null;
  isLoading?: boolean;
}

const riskConfig = {
  low: { label: "低风险", color: "text-up border-up/30 bg-up/5", barColor: "#00c853" },
  medium: { label: "中风险", color: "text-amber-400 border-amber-400/30 bg-amber-400/5", barColor: "#f59e0b" },
  high: { label: "高风险", color: "text-orange-400 border-orange-400/30 bg-orange-400/5", barColor: "#f97316" },
  extreme: { label: "极高风险", color: "text-down border-down/30 bg-down/5", barColor: "#ff5252" },
};

export function RiskBadge({ risk, isLoading }: RiskBadgeProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 border border-border/40 rounded-lg bg-muted/10">
        <div className="h-4 w-24 rounded bg-muted/30 animate-pulse" />
        <div className="h-2 w-full rounded bg-muted/20 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted/20 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!risk) return null;

  const config = riskConfig[risk.riskLevel] || riskConfig.medium;

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${config.color}`}>
      {/* Risk Level Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{config.label}</span>
          <span className="text-xs opacity-60">
            评分: {risk.riskScore}/100
          </span>
        </div>

        {/* Mini Gauge */}
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            opacity={0.15}
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={config.barColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(risk.riskScore / 100) * 100} 100`}
            transform="rotate(-90 20 20)"
            className="transition-all duration-700"
          />
        </svg>
      </div>

      {/* Risk Factors */}
      {risk.risks && risk.risks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium opacity-70">风险因素</p>
          <ul className="space-y-1">
            {risk.risks.map((r, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <span className="mt-0.5 text-[10px]">⚠️</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mitigation */}
      {risk.mitigation && risk.mitigation.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium opacity-70">风险缓释</p>
          <ul className="space-y-1">
            {risk.mitigation.map((m, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <span className="mt-0.5 text-[10px]">🛡️</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
