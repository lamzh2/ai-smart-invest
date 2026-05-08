// AI 智投 — AI 分析和 SSE 事件类型定义

// ====== 投资委员会 ======

export interface MasterAnalysis {
  master: string;
  avatar: string;
  style: string;
  stance: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
  order: number;
  keyMetrics?: string[];
  riskFactors?: string[];
  error?: string;
}

export interface DebateRound {
  round: number;
  title: string;
  bulls?: string[];
  bears?: string[];
  keyDebates?: {
    topic: string;
    bullView: string;
    bearView: string;
  }[];
  resolvedPoints?: string[];
  unresolvedPoints?: string[];
  error?: string;
}

export interface RiskAssessment {
  riskLevel: "low" | "medium" | "high" | "extreme";
  risks: string[];
  riskScore: number;
  mitigation?: string[];
  error?: string;
}

export interface ChairmanSummary {
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "extreme";
  summary: string;
  keyPoints: string[];
  bullishMasters?: string[];
  bearishMasters?: string[];
  neutralMasters?: string[];
  consensusAreas?: string[];
  disagreements?: string[];
  actionItems?: string[];
}

export interface CommitteeState {
  phase: CommitteePhase;
  sessionId: string | null;
  stockCode: string;
  stockName: string;
  progress: number;
  masters: MasterAnalysis[];
  bullCount: number;
  bearCount: number;
  neutralCount: number;
  debates: DebateRound[];
  riskAssessment: RiskAssessment | null;
  chairmanSummary: ChairmanSummary | null;
  error: string | null;
}

export type CommitteePhase =
  | "idle"
  | "loading"
  | "masters"
  | "debating"
  | "risk"
  | "chairman"
  | "done"
  | "error";

// ====== SSE Events ======

export type SSEEventType =
  | "init"
  | "data_loading"
  | "master_analysis"
  | "debate_start"
  | "debate_round"
  | "risk_assessing"
  | "risk_assessment"
  | "chairman_summarizing"
  | "chairman_summary"
  | "done"
  | "error"
  | "token"
  | "step"
  | "plan"
  | "data_collected"
  | "reflection"
  | "report_writing"
  | "chat_start"
  | "results"
  | "screener_start";

// ====== Chat ======

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

// ====== Deep Research ======

export type ResearchStep = 1 | 2 | 3 | 4;

export interface ResearchState {
  sessionId: string | null;
  topic: string;
  currentStep: ResearchStep;
  plan: Record<string, unknown> | null;
  reflection: Record<string, unknown> | null;
  report: string;
  error: string | null;
}

// ====== Leaderboard ======

export interface MasterRank {
  master: string;
  avatar: string;
  rank: number;
  accuracy: number;
  totalCalls: number;
  avgReturn: number;
  bestCall: {
    stock: string;
    return: number;
  };
  specialty: string[];
  recentPerformance: string;
}

export interface LeaderboardData {
  rankings: MasterRank[];
  updatedAt: string;
}

// ====== Screener ======

export interface ScreenerResult {
  code: string;
  name: string;
  matchScore: number;
  reasons: string[];
  keyMetrics: Record<string, unknown>;
  riskNote: string;
}
