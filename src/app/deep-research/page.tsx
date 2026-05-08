"use client";

/**
 * Deep Research 页面 — AI 自主调研
 * 4步流程: 制定计划 → 数据收集 → 反思分析 → 撰写报告
 */
import { useState, useRef, useCallback } from "react";
import { Search, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressTracker, buildSteps, type ResearchStep } from "@/components/ai/ProgressTracker";
import { ReportViewer } from "@/components/ai/ReportViewer";
import { cn } from "@/lib/utils";

const SUGGESTED_TOPICS = [
  { icon: "📊", label: "新能源板块估值分析", topic: "当前A股新能源板块（光伏、锂电、风电）估值水平横向对比及2026年下半年展望" },
  { icon: "🏦", label: "白酒行业深度研究", topic: "A股白酒行业竞争格局、龙头公司盈利质量及消费税改革影响分析" },
  { icon: "🤖", label: "AI产业链映射", topic: "A股人工智能产业链核心标的梳理：算力、大模型、应用层投资机会" },
  { icon: "🏥", label: "医药集采影响", topic: "集采政策对A股医药板块中长期影响及创新药突围路径分析" },
];

const STEPS_LABELS = ["制定计划", "数据收集", "反思分析", "撰写报告"];

export default function DeepResearchPage() {
  const [topic, setTopic] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessages, setStepMessages] = useState<Record<number, string>>({});
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [reflection, setReflection] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setCurrentStep(0);
    setStepMessages({});
    setPlan(null);
    setReflection(null);
    setReport("");
    setError(null);
  }, []);

  const startResearch = useCallback(
    async (researchTopic?: string) => {
      const query = (researchTopic ?? topic).trim();
      if (!query || isStreaming) return;
      reset();
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/deep-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: query }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "请求失败" }));
          setError(err.error || "AI 服务暂不可用");
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) { setIsStreaming(false); return; }

        const decoder = new TextDecoder();
        let buffer = "";
        let reportContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            } else if (line === "" && eventType && dataStr) {
              try {
                const data = JSON.parse(dataStr);
                handleEvent(eventType, data, { setCurrentStep, setStepMessages, setPlan, setReflection, reportContent, setReport, setError });
                if (eventType === "token" && data.content) {
                  reportContent += data.content;
                }
              } catch { /* skip */ }
              eventType = "";
              dataStr = "";
            }
          }
        }
        setReport(reportContent);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "连接异常");
      } finally {
        setIsStreaming(false);
      }
    },
    [topic, isStreaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); startResearch(); }
  };

  const steps: ResearchStep[] = buildSteps(currentStep, stepMessages);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <Search className="size-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deep Research</h1>
          <p className="text-sm text-muted-foreground">AI 自主金融调研 · 规划→执行→反思→撰写</p>
        </div>
      </div>

      {/* Input area */}
      <Card className="mt-4 shrink-0">
        <div className="flex gap-2 p-1.5">
          <Input
            placeholder="输入研究主题，如「新能源板块估值分析」..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="border-0 shadow-none text-sm h-10"
          />
          <Button
            onClick={() => startResearch()}
            disabled={!topic.trim() || isStreaming}
            className="gap-2 h-10"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            开始研究
          </Button>
        </div>
      </Card>

      {/* Suggested topics */}
      {!isStreaming && currentStep === 0 && !report && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SUGGESTED_TOPICS.map((s) => (
            <button
              key={s.label}
              onClick={() => { setTopic(s.topic); startResearch(s.topic); }}
              className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-left text-xs hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <span className="text-base">{s.icon}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Progress tracker */}
      {isStreaming && (
        <div className="mt-4 shrink-0">
          <ProgressTracker steps={steps} />
        </div>
      )}

      {/* Plan preview */}
      {plan && (
        <Card className="mt-3 shrink-0 border-border/30 bg-muted/5">
          <div className="px-3 py-2 border-b border-border/20 flex items-center gap-2">
            <Search className="size-3.5 text-primary/70" />
            <span className="text-xs font-medium">研究计划</span>
          </div>
          <div className="p-3">
            <ul className="space-y-1">
              {(plan.steps as string[] || (plan as unknown as { plan?: string[] }).plan || []).map((s: string, i: number) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary/50 mt-0.5">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Reflection */}
      {reflection && (
        <Card className="mt-3 shrink-0 border-border/30 bg-amber-500/5">
          <div className="px-3 py-2 border-b border-border/20 flex items-center gap-2">
            <Sparkles className="size-3.5 text-amber-400" />
            <span className="text-xs font-medium">AI 反思</span>
          </div>
          <div className="p-3 text-xs text-muted-foreground">
            {(reflection.content as string) || (reflection as unknown as { summary?: string }).summary || "正在进行反思分析..."}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="mt-4 shrink-0 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 p-4">
            <AlertTriangle className="size-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </Card>
      )}

      {/* Report */}
      <div className="mt-4 flex-1 min-h-0">
        {(report || isStreaming) && (
          <ReportViewer report={report} isStreaming={isStreaming} />
        )}
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground/40 shrink-0">
        ⚠️ Deep Research 内容由 AI 生成，可能存在偏差，仅供参考学习，不构成投资建议
      </p>
    </div>
  );
}

// SSE event handler (extracted for clarity)
function handleEvent(
  eventType: string,
  data: Record<string, unknown>,
  ctx: {
    setCurrentStep: (s: number) => void;
    setStepMessages: (fn: (prev: Record<number, string>) => Record<number, string>) => void;
    setPlan: (p: Record<string, unknown> | null) => void;
    setReflection: (r: Record<string, unknown> | null) => void;
    reportContent: string;
    setReport: (r: string) => void;
    setError: (e: string | null) => void;
  },
) {
  switch (eventType) {
    case "init":
      ctx.setCurrentStep(0);
      break;

    case "step":
      ctx.setCurrentStep((data.step as number) || 0);
      ctx.setStepMessages((prev) => ({
        ...prev,
        [(data.step as number) || 0]: (data.message as string) || "",
      }));
      break;

    case "plan":
      ctx.setPlan(data);
      ctx.setCurrentStep(1);
      ctx.setStepMessages((prev) => ({ ...prev, 1: "制定计划完成" }));
      break;

    case "data_collected":
      ctx.setCurrentStep(2);
      ctx.setStepMessages((prev) => ({
        ...prev,
        2: (data.message as string) || "数据收集完成",
      }));
      break;

    case "reflection":
      ctx.setReflection(data);
      ctx.setCurrentStep(3);
      ctx.setStepMessages((prev) => ({ ...prev, 3: "反思分析完成" }));
      break;

    case "report_writing":
      ctx.setCurrentStep(4);
      ctx.setReport("");
      break;

    case "token":
      ctx.setReport(ctx.reportContent + ((data.content as string) || ""));
      break;

    case "done":
      break;

    case "error":
      ctx.setError((data.message as string) || "未知错误");
      break;
  }
}
