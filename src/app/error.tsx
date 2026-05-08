"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">发生错误</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "页面加载时出现意外错误，请重试。"}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
