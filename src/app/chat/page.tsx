"use client";

/**
 * AI 对话页面 — 支持 Markdown、SSE 流式、股票卡片内联
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Plus, Trash2, Bot, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AIMessageBubble } from "@/components/ai/AIMessageBubble";
import type { ChatMessage } from "@/types/ai";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `你好！我是 **AI 智投** 的智能助手 🤖

我可以帮你：
- 📊 **分析个股**：输入股票代码（如 000001），我会从基本面、技术面、资金面多角度分析
- 📈 **解读行情**：了解当前市场热点和板块轮动
- 💡 **投资策略**：提供投资思路参考（不构成投资建议）
- 🔍 **行业洞察**：深度解读行业趋势

请输入你的问题或股票代码，我会尽力解答！`,
  timestamp: Date.now(),
};

const QUICK_PROMPTS = [
  "分析 贵州茅台 (600519) 的投资价值",
  "当前市场热点板块有哪些？",
  "宁德时代 基本面分析",
  "如何判断一只股票的估值是否合理？",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([WELCOME_MESSAGE]);
    setIsStreaming(false);
    setSessionId(null);
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim();
      if (!query || isStreaming) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);

      // Create assistant placeholder
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `❌ 错误：${err.error || "请求失败"}` }
                : m,
            ),
          );
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

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

                switch (eventType) {
                  case "chat_start":
                    break;
                  case "token":
                    fullContent += data.content || "";
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: fullContent }
                          : m,
                      ),
                    );
                    break;
                  case "error":
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? { ...m, content: `❌ ${data.message || "请求失败"}` }
                          : m,
                      ),
                    );
                    setIsStreaming(false);
                    break;
                  case "done":
                    break;
                }
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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `❌ 连接异常：${err instanceof Error ? err.message : "未知错误"}` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastAssistantIdx = [...messages].reverse().findIndex((m) => m.role === "assistant");
  const isLastAssistantStreaming =
    lastAssistantIdx === 0 && isStreaming;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 助手</h1>
            <p className="text-sm text-muted-foreground">
              智能分析 · 实时解读 · 流式对话
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="gap-2"
        >
          <Trash2 className="size-4" />
          清空
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg, idx) => {
          const isLastAssistant =
            msg.role === "assistant" &&
            idx === messages.length - 1;
          return (
            <AIMessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isLastAssistant && isStreaming}
            />
          );
        })}

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-3">
              <Sparkles className="mx-auto size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                开始与 AI 助手对话
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && !isStreaming && (
        <div className="flex flex-wrap gap-2 pb-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 pt-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={clearChat}
            className="shrink-0"
            title="新会话"
          >
            <Plus className="size-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="输入问题或股票代码... (Enter 发送)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
          ⚠️ AI 分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。
        </p>
      </div>
    </div>
  );
}
