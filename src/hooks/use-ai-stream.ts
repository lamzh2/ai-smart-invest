/**
 * AI SSE Stream Hook — 消费 SSE 事件流并管理状态
 */
"use client";

import { useCallback, useRef } from "react";
import type { SSEEventType, CommitteeState, CommitteePhase } from "@/types/ai";

export function useCommitteeStream() {
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      stockCode: string,
      onPhase: (phase: CommitteePhase) => void,
      onMaster: (data: Record<string, unknown>) => void,
      onDebateRound: (data: Record<string, unknown>) => void,
      onRisk: (data: Record<string, unknown>) => void,
      onChairman: (data: Record<string, unknown>) => void,
      onProgress: (progress: number, message: string) => void,
      onError: (msg: string) => void,
      onDone: () => void,
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/committee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock_code: stockCode }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          onError(err.error || "请求失败");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          onError("无法读取响应流");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

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
              // Complete SSE event
              try {
                const data = JSON.parse(dataStr);
                handleSSEEvent(
                  eventType as SSEEventType,
                  data,
                  onPhase,
                  onMaster,
                  onDebateRound,
                  onRisk,
                  onChairman,
                  onProgress,
                  onError,
                  onDone,
                );
              } catch {
                // Skip unparseable events
              }
              eventType = "";
              dataStr = "";
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        onError(err instanceof Error ? err.message : "连接异常");
      }
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startStream, abort };
}

function handleSSEEvent(
  type: SSEEventType,
  data: Record<string, unknown>,
  onPhase: (p: CommitteePhase) => void,
  onMaster: (d: Record<string, unknown>) => void,
  onDebateRound: (d: Record<string, unknown>) => void,
  onRisk: (d: Record<string, unknown>) => void,
  onChairman: (d: Record<string, unknown>) => void,
  onProgress: (progress: number, msg: string) => void,
  onError: (msg: string) => void,
  onDone: () => void,
) {
  switch (type) {
    case "init":
      onPhase("loading");
      break;
    case "data_loading":
      onProgress(
        (data.progress as number) ?? 0,
        (data.message as string) ?? "",
      );
      break;
    case "master_analysis":
      onPhase("masters");
      onMaster(data);
      break;
    case "debate_start":
      onPhase("debating");
      break;
    case "debate_round":
      onDebateRound(data);
      break;
    case "risk_assessing":
      onPhase("risk");
      break;
    case "risk_assessment":
      onRisk(data);
      break;
    case "chairman_summarizing":
      onPhase("chairman");
      break;
    case "chairman_summary":
      onChairman(data);
      break;
    case "done":
      onPhase("done");
      onDone();
      break;
    case "error":
      onError((data.message as string) ?? "未知错误");
      break;
  }
}
