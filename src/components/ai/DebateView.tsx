"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DebateRound } from "@/types/ai";

interface DebateViewProps {
  debates: DebateRound[];
  bullCount: number;
  bearCount: number;
  neutralCount: number;
}

export function DebateView({
  debates,
  bullCount,
  bearCount,
  neutralCount,
}: DebateViewProps) {
  if (!debates.length) return null;

  return (
    <div className="space-y-4">
      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="bg-up/5 border-up/20 p-3">
          <p className="text-xs text-muted-foreground">看多</p>
          <p className="text-xl font-bold text-up">{bullCount}</p>
        </Card>
        <Card className="bg-muted/10 border-muted/20 p-3">
          <p className="text-xs text-muted-foreground">中性</p>
          <p className="text-xl font-bold text-muted-foreground">
            {neutralCount}
          </p>
        </Card>
        <Card className="bg-down/5 border-down/20 p-3">
          <p className="text-xs text-muted-foreground">看空</p>
          <p className="text-xl font-bold text-down">{bearCount}</p>
        </Card>
      </div>

      {/* Debate Rounds */}
      {debates.map((round) => (
        <Card
          key={round.round}
          className="border-border/60 bg-card/50 overflow-hidden"
        >
          <div className="border-b border-border/20 bg-muted/20 px-4 py-2">
            <p className="text-sm font-medium">
              第 {round.round} 轮辩论：{round.title}
            </p>
          </div>
          <div className="p-4 space-y-3">
            {/* Bulls vs Bears statements */}
            <div className="grid gap-3 md:grid-cols-2">
              {round.bulls && round.bulls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-up">🟢 看多方观点</p>
                  {round.bulls.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-up/5 border border-up/10 p-2 text-xs"
                    >
                      {b}
                    </div>
                  ))}
                </div>
              )}
              {round.bears && round.bears.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-down">🔴 看空方观点</p>
                  {round.bears.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-down/5 border border-down/10 p-2 text-xs"
                    >
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Debates */}
            {round.keyDebates && round.keyDebates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  核心交锋
                </p>
                {round.keyDebates.map((d, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border/30 bg-muted/10 p-3 space-y-2"
                  >
                    <p className="text-xs font-semibold">{d.topic}</p>
                    <div className="grid gap-2 md:grid-cols-2 text-xs">
                      <div>
                        <span className="text-up/60">看多: </span>
                        <span>{d.bullView}</span>
                      </div>
                      <div>
                        <span className="text-down/60">看空: </span>
                        <span>{d.bearView}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resolved/Unresolved */}
            {round.resolvedPoints && round.resolvedPoints.length > 0 && (
              <div>
                <p className="text-xs font-medium text-up/70">✅ 共识</p>
                <ul className="text-xs list-disc pl-4 space-y-0.5 mt-1">
                  {round.resolvedPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {round.unresolvedPoints && round.unresolvedPoints.length > 0 && (
              <div>
                <p className="text-xs font-medium text-down/70">
                  ⚠ 待解决分歧
                </p>
                <ul className="text-xs list-disc pl-4 space-y-0.5 mt-1">
                  {round.unresolvedPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
