"use client";

/**
 * 投资委员会页面 — Multi-Agent AI 股票分析 (旗舰功能)
 *
 * 流程: 输入股票代码 → 8位AI大师分析 → 辩论 → 风控 → 主席总结
 */
import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search, Play, RefreshCw, AlertTriangle, Info, Zap, ShieldCheck, Users, Swords } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpot } from "@/hooks/use-market-data";
import { useCommitteeStream } from "@/hooks/use-ai-stream";
import { CommitteeFlow } from "@/components/ai/CommitteeFlow";
import { ChainOfThought, COMMITTEE_STEPS, type StepStatus } from "@/components/ai/ChainOfThought";
import { MasterCard } from "@/components/ai/MasterCard";
import { DebateView } from "@/components/ai/DebateView";
import { RiskBadge } from "@/components/ai/RiskBadge";
import { ChairmanSummaryView } from "@/components/ai/ChairmanSummaryView";
import { ConfidenceGauge } from "@/components/ai/ConfidenceGauge";
import type {
  CommitteePhase,
  MasterAnalysis,
  DebateRound,
  RiskAssessment,
  ChairmanSummary,
} from "@/types/ai";

export default function CommitteePage() {
  const router = useRouter();
  const [stockCode, setStockCode] = useState("");
  const [debouncedCode] = useDebounce(stockCode, 300);
  const [selectedStock, setSelectedStock] = useState<{ code: string; name: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Committee state
  const [phase, setPhase] = useState<CommitteePhase>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [masters, setMasters] = useState<MasterAnalysis[]>([]);
  const [debates, setDebates] = useState<DebateRound[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [chairmanSummary, setChairmanSummary] = useState<ChairmanSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Stock search
  const { data: spotData } = useSpot(1, 200, "change_percent", "desc");
  const allStocks = spotData?.data ?? [];

  const searchResults = useMemo(() => {
    if (!debouncedCode.trim() || debouncedCode.length < 1) return [];
    const q = debouncedCode.toLowerCase();
    return allStocks
      .filter(
        (s) => s.code.includes(q) || s.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [allStocks, debouncedCode]);

  // SSE stream hook
  const { startStream, abort } = useCommitteeStream();

  // Step chain state
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    data: "pending",
    masters: "pending",
    debate: "pending",
    risk: "pending",
    chairman: "pending",
  });

  const currentSteps = useMemo(() => {
    return COMMITTEE_STEPS.map((s) => ({
      ...s,
      status:
        phase === "error"
          ? (s.id === "data" && stepStatuses.data === "completed" ? "completed" :
             s.id === "masters" && stepStatuses.masters === "completed" ? "completed" :
             s.status === "active" ? "error" : s.status)
          : stepStatuses[s.id] || s.status,
      detail:
        s.id === "data" && stepStatuses.data === "active" ? progressMsg : undefined,
    }));
  }, [stepStatuses, phase, progressMsg]);

  // Reset
  const resetAnalysis = useCallback(() => {
    abort();
    setPhase("idle");
    setProgress(0);
    setProgressMsg("");
    setMasters([]);
    setDebates([]);
    setRiskAssessment(null);
    setChairmanSummary(null);
    setError(null);
    setSessionId(null);
    setStepStatuses({
      data: "pending",
      masters: "pending",
      debate: "pending",
      risk: "pending",
      chairman: "pending",
    });
  }, [abort]);

  // Start analysis
  const startAnalysis = useCallback(() => {
    if (!selectedStock) return;
    resetAnalysis();
    setPhase("loading");
    setStepStatuses((prev) => ({ ...prev, data: "active" }));

    const handleMaster = (data: Record<string, unknown>) => {
      const masterData = data as unknown as MasterAnalysis;
      setMasters((prev) => {
        const existing = prev.find((m) => m.master === masterData.master);
        if (existing) {
          return prev.map((m) =>
            m.master === masterData.master ? { ...m, ...masterData } : m,
          );
        }
        return [...prev, masterData];
      });
      setStepStatuses((prev) => ({
        ...prev,
        data: "completed",
        masters: "active",
      }));
    };

    const handleDebateRound = (data: Record<string, unknown>) => {
      setDebates((prev) => [...prev, data as unknown as DebateRound]);
      setStepStatuses((prev) => ({
        ...prev,
        masters: "completed",
        debate: "active",
      }));
    };

    const handleRisk = (data: Record<string, unknown>) => {
      setRiskAssessment(data as unknown as RiskAssessment);
      setStepStatuses((prev) => ({
        ...prev,
        debate: "completed",
        risk: "active",
      }));
    };

    const handleChairman = (data: Record<string, unknown>) => {
      const summary = data as unknown as ChairmanSummary;
      setChairmanSummary(summary);
      setSessionId((data as Record<string, unknown>).sessionId as string || null);
      setStepStatuses((prev) => ({
        ...prev,
        risk: "completed",
        chairman: "active",
      }));
    };

    const handleProgress = (p: number, msg: string) => {
      setProgress(p);
      setProgressMsg(msg);
    };

    const handleError = (msg: string) => {
      setError(msg);
      setPhase("error");
    };

    const handleDone = () => {
      setProgress(1);
      setStepStatuses((prev) => ({
        ...prev,
        chairman: "completed",
      }));
    };

    startStream(
      selectedStock.code,
      (p) => setPhase(p),
      handleMaster,
      handleDebateRound,
      handleRisk,
      handleChairman,
      handleProgress,
      handleError,
      handleDone,
    );
  }, [selectedStock, startStream, resetAnalysis]);

  // Bull/Neutral/Bear counts
  const bullCount = useMemo(() => masters.filter((m) => m.stance === "bullish").length, [masters]);
  const bearCount = useMemo(() => masters.filter((m) => m.stance === "bearish").length, [masters]);
  const neutralCount = useMemo(() => masters.filter((m) => m.stance === "neutral").length, [masters]);

  // Average confidence
  const avgConfidence = useMemo(() => {
    if (!masters.length) return 0;
    return masters.reduce((sum, m) => sum + (m.confidence || 0), 0) / masters.length;
  }, [masters]);

  const allMastersLoaded = masters.length >= 8;
  const isRunning = phase !== "idle" && phase !== "done" && phase !== "error";

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">投资委员会</h1>
            <p className="text-sm text-muted-foreground">
              8位AI投资大师协作分析 · 辩论交锋 · 风控把关 · 最终决策
            </p>
          </div>
        </div>
      </div>

      {/* Stock Input Section */}
      <Card className="border-border/60 bg-card/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">输入股票代码或名称</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="例如: 000001 或 平安银行"
                value={stockCode}
                onChange={(e) => {
                  setStockCode(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="pl-9 font-mono"
                disabled={isRunning}
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                  {searchResults.map((s) => (
                    <button
                      key={s.code}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setStockCode(`${s.code} ${s.name}`);
                        setSelectedStock({ code: s.code, name: s.name });
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-mono text-xs tabular-nums text-muted-foreground min-w-[60px]">
                        {s.code}
                      </span>
                      <span className="font-medium">{s.name}</span>
                      <span
                        className={`ml-auto text-xs tabular-nums ${
                          s.change_percent > 0
                            ? "text-up"
                            : s.change_percent < 0
                              ? "text-down"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.change_percent > 0 ? "+" : ""}
                        {s.change_percent.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isRunning ? (
              <Button variant="outline" onClick={resetAnalysis} className="gap-2">
                <AlertTriangle className="size-4" />
                停止
              </Button>
            ) : (
              <Button
                onClick={startAnalysis}
                disabled={!selectedStock}
                className="gap-2 min-w-[120px]"
              >
                <Play className="size-4" />
                开始分析
              </Button>
            )}
          </div>
        </div>

        {selectedStock && phase === "idle" && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <span className="font-mono">{selectedStock.code}</span>
              <span>{selectedStock.name}</span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              点击「开始分析」启动投资委员会
            </span>
          </div>
        )}
      </Card>

      {/* Idle State */}
      {phase === "idle" && !selectedStock && (
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-lg text-center space-y-6">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10">
              <Zap className="size-10 text-primary/60" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">AI 投资委员会</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                体验前所未有的 AI 投资分析方式。输入任意 A 股代码，8
                位拥有不同投资哲学的 AI 大师将同时为您分析，看多与看空方正面辩论，
                风控委员会严格把关，投委会主席给出最终综合判断。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Users, label: "8位AI大师", desc: "巴菲特、索罗斯、林奇、西蒙斯..." },
                { icon: Swords, label: "辩论交锋", desc: "看多方与看空方正面对决" },
                { icon: ShieldCheck, label: "风控把关", desc: "多维度风险综合评估" },
              ].map((item) => (
                <Card key={item.label} className="border-border/40 bg-card/40 p-3 space-y-1">
                  <item.icon className="mx-auto size-5 text-muted-foreground" />
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60">
              ⚠️ AI 分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。
            </p>
          </div>
        </div>
      )}

      {/* Running / Done State */}
      {phase !== "idle" && (
        <div className="space-y-6">
          {/* Process Flow */}
          <Card className="border-border/60 bg-card/60 p-5">
            <CommitteeFlow phase={phase} progress={progress} />
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-down/30 bg-down/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-down shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-down">分析中断</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={startAnalysis}
                  >
                    <RefreshCw className="size-3.5" />
                    重新分析
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Two-column: Chain + Content */}
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Left: Chain of Thought */}
            <Card className="border-border/60 bg-card/60 p-4 h-fit lg:sticky lg:top-20">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                分析流程
              </p>
              <ChainOfThought steps={currentSteps} />
            </Card>

            {/* Right: Content */}
            <div className="space-y-6 min-w-0">
              {/* Masters Grid */}
              {(masters.length > 0 || phase === "loading" || (phase === "masters" && masters.length < 8)) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                      大师分析
                      {allMastersLoaded && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({bullCount}看多 · {neutralCount}中性 · {bearCount}看空)
                        </span>
                      )}
                    </h2>
                    {allMastersLoaded && (
                      <ConfidenceGauge
                        value={avgConfidence}
                        size="sm"
                        label="平均信心"
                      />
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {masters.map((master) => (
                      <MasterCard
                        key={master.master}
                        master={master}
                        isRevealed={true}
                      />
                    ))}
                    {!allMastersLoaded && phase !== "done" && phase !== "error" && (
                      <>
                        {Array.from({ length: 8 - masters.length }).map((_, i) => (
                          <Card key={`skel-${i}`} className="overflow-hidden border-border/60 bg-card/40">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <Skeleton className="size-10 rounded-full" />
                                <div className="space-y-1.5">
                                  <Skeleton className="h-4 w-20" />
                                  <Skeleton className="h-3 w-14" />
                                </div>
                              </div>
                              <Skeleton className="h-1.5 w-full" />
                              <Skeleton className="h-2.5 w-full" />
                              <Skeleton className="h-2.5 w-3/4" />
                            </div>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Debate */}
              {debates.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">辩论交锋</h2>
                  <DebateView
                    debates={debates}
                    bullCount={bullCount}
                    bearCount={bearCount}
                    neutralCount={neutralCount}
                  />
                </div>
              )}

              {/* Risk */}
              {(riskAssessment || phase === "risk" || stepStatuses.risk === "active") && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">风险评估</h2>
                  <RiskBadge
                    risk={riskAssessment}
                    isLoading={!riskAssessment && stepStatuses.risk === "active"}
                  />
                </div>
              )}

              {/* Chairman */}
              {(chairmanSummary || phase === "chairman" || stepStatuses.chairman === "active") && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">主席最终判断</h2>
                  <ChairmanSummaryView
                    summary={chairmanSummary}
                    isLoading={!chairmanSummary && stepStatuses.chairman === "active"}
                  />
                </div>
              )}

              {/* Done Footer */}
              {phase === "done" && chairmanSummary && (
                <Card className="border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        分析完成 · 结果仅供参考，不构成投资建议
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedStock) {
                            router.push(`/stock/${selectedStock.code}`);
                          }
                        }}
                      >
                        查看行情
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAnalysis}
                        className="gap-2"
                      >
                        <RefreshCw className="size-3.5" />
                        分析其他股票
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
