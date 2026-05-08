/**
 * AI 智投 — AI 分析记录持久化
 * 投资委员会结果、Deep Research 报告自动保存到 DB
 */
import { createSession, completeSession, failSession, saveMessage, saveReport } from "@/lib/db-queries";

// ===== Committee Session =====

interface CommitteeSaveParams {
  userId: string;
  stockCode: string;
  stockName: string;
  masters: Array<{ master: string; stance: string; reasoning: string; confidence: number }>;
  chairmanSummary?: {
    recommendation: string;
    confidence: number;
    summary: string;
    keyPoints: string[];
  };
}

export async function saveCommitteeResult(params: CommitteeSaveParams) {
  const { userId, stockCode, stockName, masters, chairmanSummary } = params;

  // Create session
  const session = await createSession({
    userId,
    type: "committee",
    stockCode,
    title: `${stockName}(${stockCode}) 投资委员会分析`,
  });

  if (!session) return null;

  // Save each master's analysis
  for (const m of masters) {
    await saveMessage({
      sessionId: session.id,
      role: "master",
      masterName: m.master,
      content: `**【${m.stance === "bullish" ? "看多" : m.stance === "bearish" ? "看空" : "中性"}】${m.master}**\n\n${m.reasoning}`,
      metadata: { stance: m.stance, confidence: m.confidence },
    });
  }

  // Save chairman summary
  if (chairmanSummary) {
    await saveMessage({
      sessionId: session.id,
      role: "chairman",
      content: `## 投委会主席综合判断\n\n**建议**: ${chairmanSummary.recommendation === "buy" ? "买入" : chairmanSummary.recommendation === "hold" ? "持有" : "卖出"}\n**置信度**: ${(chairmanSummary.confidence * 100).toFixed(0)}%\n\n${chairmanSummary.summary}\n\n### 关键要点\n${chairmanSummary.keyPoints.map((p) => `- ${p}`).join("\n")}`,
      metadata: chairmanSummary,
    });

    // Also save as a report
    await saveReport({
      userId,
      sessionId: session.id,
      stockCode,
      stockName,
      title: `${stockName}(${stockCode}) 投资委员会报告`,
      content: `# ${stockName}(${stockCode}) 投资委员会分析报告\n\n## 主席建议\n${chairmanSummary.recommendation} | 置信度: ${(chairmanSummary.confidence * 100).toFixed(0)}%\n\n${chairmanSummary.summary}\n\n## 大师分析\n${masters.map((m) => `### ${m.master} (${m.stance})\n${m.reasoning}`).join("\n\n")}`,
      summary: chairmanSummary.summary,
      recommendation: chairmanSummary.recommendation as "buy" | "hold" | "sell",
      confidence: chairmanSummary.confidence,
    });
  }

  await completeSession(session.id);
  return session;
}

// ===== Deep Research =====

interface DeepResearchSaveParams {
  userId: string;
  topic: string;
  stockCode?: string;
  stockName?: string;
  content: string;
  summary: string;
  tags?: string[];
}

export async function saveDeepResearchResult(params: DeepResearchSaveParams) {
  const { userId, topic, stockCode, stockName, content, summary, tags } = params;

  const session = await createSession({
    userId,
    type: "deep_research",
    stockCode,
    title: `深度调研: ${topic}`,
  });

  if (!session) return null;

  await saveMessage({
    sessionId: session.id,
    role: "assistant",
    content: `## ${topic}\n\n${summary}`,
    metadata: { topic, tags },
  });

  const report = await saveReport({
    userId,
    sessionId: session.id,
    stockCode: stockCode || "",
    stockName: stockName || topic,
    title: `深度调研: ${topic}`,
    content,
    summary,
    tags,
  });

  await completeSession(session.id);
  return { session, report };
}

// ===== Chat Session =====

export async function createChatSession(userId: string, title: string) {
  return createSession({ userId, type: "chat", title });
}

export async function saveChatMessage(sessionId: string, role: "user" | "assistant", content: string) {
  return saveMessage({ sessionId, role, content });
}

export async function endChatSession(sessionId: string) {
  await completeSession(sessionId);
}

// ===== Error Handling =====

export async function markSessionError(sessionId: string) {
  await failSession(sessionId);
}
