/**
 * Deep Research API — AI 自主深度研究
 * POST /api/ai/deep-research — SSE 流式返回研究过程
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { streamChat } from "@/lib/ai-client";

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

  const { topic } = await req.json();
  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: string, data: any) => {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      const s = (e: string, d: any) => send(controller, e, d);
      try {
        // Phase 1: Planning
        s("phase", { phase: "planning", message: `正在规划研究: ${topic}` });
        const plan = await streamChat([
          { role: "system", content: "你是金融研究分析师。请为研究主题制定3步研究计划，用中文回复。" },
          { role: "user", content: `请为以下主题制定研究计划：${topic}` },
        ]);
        s("plan", { plan });

        // Phase 2: Research steps
        const steps = plan.split("\n").filter(l => l.match(/^[0-9]/)).slice(0, 3);
        for (let i = 0; i < steps.length; i++) {
          s("phase", { phase: `research_${i + 1}`, message: `正在执行第${i + 1}步研究...` });
          const result = await streamChat([
            { role: "system", content: `你是金融分析师，执行第${i + 1}步研究。中文回复，控制在200字内。` },
            { role: "user", content: `研究主题：${topic}\n研究计划：${plan}\n请执行第${i + 1}步：${steps[i]}` },
          ], {
            onToken: (token) => s("token", { step: i + 1, content: token }),
          });
          s("step_complete", { step: i + 1, result });
        }

        // Phase 3: Final report
        s("phase", { phase: "report", message: "正在生成研究报告..." });
        const report = await streamChat([
          { role: "system", content: "你是金融研究分析师，请写出结构化的研究报告。中文，含摘要、分析、结论。" },
          { role: "user", content: `研究主题：${topic}\n研究过程：${steps.join("；")}\n请写出完整研究报告。` },
        ], {
          onToken: (token) => s("report_token", { content: token }),
        });
        s("report", { report });

        s("done", {});
      } catch (err: any) {
        s("error", { message: err.message || "研究过程出错" });
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
