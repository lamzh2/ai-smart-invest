"use client";

/**
 * ReportViewer — Deep Research 报告渲染（Markdown + 来源引用 + 导出）
 */
import { useState } from "react";
import { Download, FileDown, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReportViewerProps {
  report: string;
  isStreaming?: boolean;
  className?: string;
}

// Sanitize and render markdown-like content
function renderMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted/30 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted/40 px-1 py-0.5 rounded text-xs">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary hover:underline">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-muted-foreground">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm text-muted-foreground">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-border/30" />')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-primary/30 pl-3 my-2 text-sm text-muted-foreground italic">$1</blockquote>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, "</p><p class='text-sm text-muted-foreground leading-relaxed my-2'>")
    // Single newlines to <br>
    .replace(/\n/g, "<br>");
}

export function ReportViewer({ report, isStreaming, className }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deep-research-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!report && !isStreaming) return null;

  const htmlContent = renderMarkdown(report);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2 bg-muted/10">
        <div className="flex items-center gap-2">
          <FileDown className="size-4 text-emerald-400" />
          <span className="text-xs font-medium">Deep Research 报告</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              生成中...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "已复制" : "复制"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExport}>
            <Download className="size-3" />
            导出 MD
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {report ? (
          <div
            className="prose-sm prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-border/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          ⚠️ 本报告由 AI 生成，仅供参考学习，不构成投资建议
        </p>
      </div>
    </Card>
  );
}
