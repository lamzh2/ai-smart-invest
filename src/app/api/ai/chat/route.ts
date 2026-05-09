/**
 * AI 对话 API — 直接调用 DeepSeek SSE 流式
 * POST /api/ai/chat
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { streamChat, createSSEStream } from "@/lib/ai-client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "请先登录" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip).ok) {
    return new Response(JSON.stringify({ error: "请求过于频繁" }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(
          `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        ));
      };

      try {
        await streamChat(messages, {
          onToken: (token) => send("token", { content: token }),
          onComplete: () => send("done", {}),
          onError: (err) => send("error", { message: err.message }),
        });
      } catch (err: any) {
        send("error", { message: err.message || "AI 服务不可用" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
