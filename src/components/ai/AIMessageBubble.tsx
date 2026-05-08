"use client";

/**
 * AIMessageBubble — AI 对话消息气泡
 * 支持 Markdown 渲染、流式打字、思考链折叠
 */
import { useState } from "react";
import { Bot, User, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/ai";

interface AIMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function SimpleMarkdown({ content }: { content: string }) {
  // Render basic markdown: bold, italic, code, lists, headings
  const html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code class='bg-muted/50 px-1 py-0.5 rounded text-xs font-mono'>$1</code>")
    // Headers
    .replace(/^### (.+)$/gm, "<h3 class='text-sm font-semibold mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-base font-semibold mt-4 mb-1'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-lg font-bold mt-4 mb-2'>$1</h1>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc text-sm'>$1</li>")
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal text-sm'>$1</li>")
    // Bold number markers (e.g., "1. **title**")
    .replace(/\*\*(\d+\. .+?)\*\*/g, "<strong>$1</strong>")
    // Newlines
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");

  return (
    <div
      className="text-sm leading-relaxed [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:text-sm [&_br]:block [&_br]:content-[''] [&_br]:mb-1"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function AIMessageBubble({ message, isStreaming }: AIMessageBubbleProps) {
  const isUser = message.role === "user";
  const isThinking = message.isThinking ?? false;
  const [thinkingExpanded, setThinkingExpanded] = useState(true);

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm",
          isUser
            ? "bg-primary/10 text-primary"
            : isThinking
              ? "bg-amber-500/10 text-amber-500"
              : "bg-muted/30 text-muted-foreground",
        )}
      >
        {isUser ? (
          <User className="size-4" />
        ) : isThinking ? (
          <Brain className="size-4" />
        ) : (
          <Bot className="size-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : isThinking
              ? "bg-amber-500/5 border border-amber-500/20"
              : "bg-card border border-border/60",
        )}
      >
        {/* Thinking header */}
        {isThinking && (
          <button
            onClick={() => setThinkingExpanded(!thinkingExpanded)}
            className="flex items-center gap-2 text-xs text-amber-500/80 mb-1 -mt-0.5 hover:text-amber-500 transition-colors"
          >
            <Brain className="size-3" />
            <span>思考过程</span>
            {thinkingExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        )}

        {/* Content */}
        <div className={cn(isThinking && !thinkingExpanded && "hidden")}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <SimpleMarkdown content={message.content} />
          )}
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5 align-middle" />
        )}

        {/* Timestamp */}
        {!isStreaming && message.timestamp > 0 && (
          <p className="text-[10px] opacity-40 mt-1 text-right">
            {new Date(message.timestamp).toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
