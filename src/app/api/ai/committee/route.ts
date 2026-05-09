/**
 * 投资委员会 API — 8 位 AI 大师分析 + 辩论 + 风控
 * POST /api/ai/committee — SSE 流式返回分析过程
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { streamChat, DEEPSEEK_MODEL } from "@/lib/ai-client";

const MASTERS = [
  { id: "buffett", name: "巴菲特", style: "价值投资", stance: "长线看多" },
  { id: "soros", name: "索罗斯", style: "宏观对冲", stance: "趋势跟随" },
  { id: "lynch", name: "彼得·林奇", style: "成长股挖掘", stance: "自下而上" },
  { id: "simons", name: "西蒙斯", style: "量化分析", stance: "数据驱动" },
  { id: "dalio", name: "达利欧", style: "全天候策略", stance: "风险平价" },
  { id: "graham", name: "格雷厄姆", style: "安全边际", stance: "价值发现" },
  { id: "livermore", name: "利弗莫尔", style: "趋势交易", stance: "顺势而为" },
  { id: "rogers", name: "罗杰斯", style: "逆向投资", stance: "周期洞察" },
];

function buildMasterPrompt(master: typeof MASTERS[0], stockInfo: string) {
  return `你是一位世界级投资大师——${master.name}。

你的投资风格：${master.style}
你的核心立场：${master.stance}

现在请分析以下A股股票：
${stockInfo}

请用中文给出你的分析，格式如下：
1. 立场：看多/看空/中性
2. 置信度：0-100的数字
3. 核心逻辑：用3-5句话说明你的判断依据
4. 关键风险：1-2个需要警惕的风险点`;
}

function buildChairmanPrompt(analyses: string, debate: string) {
  return `你是投资委员会主席。请综合以下8位投资大师的分析和辩论，给出最终建议。

【大师分析】
${analyses}

【辩论记录】
${debate}

请给出：
1. 最终建议：买入/卖出/持有
2. 置信度：0-100
3. 决策摘要：用3-5句话总结
4. 关键要点：列出3-5条最重要的要点`;
}

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

  const { stockCode, stockName = "未知", stockContext = "" } = await req.json();
  const stockInfo = `股票代码：${stockCode}\n股票名称：${stockName}\n${stockContext}`;

  const encoder = new TextEncoder();
  const sendEvent = (controller: ReadableStreamDefaultController, event: string, data: any) => {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => sendEvent(controller, event, data);

      try {
        // Phase 1: Init
        send("init", { stockCode, stockName, masters: MASTERS.map(m => ({ id: m.id, name: m.name })) });

        // Phase 2: 8 Masters Analysis (parallel in groups of 2 for rate limiting)
        const analyses: { id: string; name: string; stance: string; confidence: number; reasoning: string; risks: string }[] = [];
        
        for (let i = 0; i < MASTERS.length; i += 2) {
          const batch = MASTERS.slice(i, i + 2);
          const results = await Promise.all(
            batch.map(async (master) => {
              send("master_analyzing", { masterId: master.id, name: master.name });
              
              const prompt = buildMasterPrompt(master, stockInfo);
              const text = await streamChat([
                { role: "system", content: "你是一位世界级投资大师。请用中文回复。格式：立场|置信度|逻辑|风险" },
                { role: "user", content: prompt },
              ]);

              // Parse the analysis
              const lines = text.split("\n").filter(l => l.trim());
              const stance = text.includes("看多") ? "bullish" : text.includes("看空") ? "bearish" : "neutral";
              const confMatch = text.match(/(\d+)/);
              const confidence = confMatch ? Math.min(100, Math.max(0, parseInt(confMatch[0]))) : 50;
              const reasoning = lines.slice(2, 5).join(" ").substring(0, 200);
              const risks = lines.find(l => l.includes("风险")) || "";

              return { id: master.id, name: master.name, stance, confidence, reasoning, risks };
            })
          );

          results.forEach(r => {
            analyses.push(r);
            send("master_analysis", r);
          });

          // Small delay between batches
          if (i + 2 < MASTERS.length) await new Promise(r => setTimeout(r, 500));
        }

        // Phase 3: Debate
        send("debate_start", {});
        const bullMasters = analyses.filter(a => a.stance === "bullish");
        const bearMasters = analyses.filter(a => a.stance === "bearish");
        
        const debatePrompt = `看多方（${bullMasters.map(m => m.name).join("、")}）认为：${bullMasters.map(m => m.reasoning).join("；")}\n看空方（${bearMasters.map(b => b.name).join("、")}）认为：${bearMasters.map(b => b.reasoning).join("；")}\n\n请模拟一场3轮辩论，每轮双方各反驳对方观点。中文，简洁。`;
        
        const debateText = await streamChat([
          { role: "user", content: debatePrompt },
        ], { temperature: 0.9, maxTokens: 1500 });

        const debateRounds = debateText.split(/\n{2,}/).filter(r => r.trim()).slice(0, 3);
        for (let i = 0; i < debateRounds.length; i++) {
          send("debate_round", { round: i + 1, content: debateRounds[i] });
        }

        // Phase 4: Chairman Summary
        send("chairman_summarizing", {});
        const summaryPrompt = buildChairmanPrompt(
          analyses.map(a => `${a.name}(${a.stance === "bullish" ? "看多" : a.stance === "bearish" ? "看空" : "中性"}, 置信度${a.confidence}%): ${a.reasoning}`).join("\n"),
          debateRounds.join("\n\n")
        );

        const summaryText = await streamChat([
          { role: "system", content: "你是投资委员会主席，请用中文给出最终投资建议。" },
          { role: "user", content: summaryPrompt },
        ]);

        const recommendation = summaryText.includes("买入") ? "buy" : summaryText.includes("卖出") ? "sell" : "hold";
        const confMatch = summaryText.match(/(\d+)/);
        const confidence = confMatch ? Math.min(100, Math.max(0, parseInt(confMatch[0]))) : 50;
        
        const keyPoints = summaryText.split("\n")
          .filter(l => l.trim().match(/^[0-9\-\*\•]/))
          .slice(0, 5)
          .map(l => l.replace(/^[0-9\-\*\•\.\s]+/, ""));

        send("chairman_summary", {
          recommendation,
          confidence,
          summary: summaryText.substring(0, 500),
          keyPoints: keyPoints.length > 0 ? keyPoints : ["综合分析各大师意见", "建议结合市场情绪判断", "注意风险控制"],
        });

        send("done", {});
      } catch (err: any) {
        send("error", { message: err.message || "分析过程出错" });
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
