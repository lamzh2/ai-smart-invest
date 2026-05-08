"use client";

/**
 * 关于页面 — 项目介绍 + 技术栈 + 设计理念
 */
import { Bot, Globe, Zap, Shield, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Bot, title: "Multi-Agent 投资委员会", desc: "8位AI投资大师各抒己见，模拟真实投委会辩论决策流程" },
  { icon: Zap, title: "SSE 实时流式分析", desc: "Server-Sent Events 技术实现Token级流式输出，所见即所得" },
  { icon: TrendingUp, title: "A股全市场覆盖", desc: "实时行情 + K线 + 技术指标 + 财务基本面，一站式数据整合" },
  { icon: Shield, title: "AI 风控评估", desc: "多维度风险评估，从市场风险到个股风险全面扫描" },
  { icon: Globe, title: "深度调研能力", desc: "AI自主规划→数据收集→反思→撰写，生成专业级研究报告" },
  { icon: Users, title: "大师实时PK", desc: "8位大师历史战绩排行榜，基于模拟数据展现不同投资风格优劣" },
];

const TECH_STACK = [
  "Next.js 15", "TypeScript", "Tailwind CSS v4", "shadcn/ui",
  "Lightweight Charts", "Zustand", "TanStack Query", "NextAuth.js v5",
  "FastAPI", "Python 3.13", "akShare", "cn-ashare",
  "Neon PostgreSQL", "Drizzle ORM", "Vercel", "Railway",
];

const DISCLAIMERS = [
  "本平台所有AI分析结果仅供参考学习，不构成任何投资建议",
  "Master排行榜数据为AI模拟生成，不代表真实投资业绩",
  "投资有风险，入市需谨慎。请根据自身风险承受能力做出决策",
  "历史数据不代表未来表现，市场可能产生剧烈波动",
];

export default function AboutPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">关于 AI 智投</h1>
          <p className="text-sm text-muted-foreground">v2.0.0-alpha · Multi-Agent AI 投资分析平台</p>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-4">
        {/* Intro */}
        <Card className="p-4 border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">AI 智投</strong> 是一个面向 A 股市场的 Multi-Agent 智能投资分析 SaaS 平台。
            融合了 2025-2026 年最前沿的 AI 金融项目设计理念，采用
            <strong className="text-foreground">多智能体协作架构</strong>，
            模拟真实投资委员会的决策流程——8 位 AI 投资大师独立分析、正面辩论、风控把关、主席综合判断。
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            区别于传统单一 AI 问答，AI 智投通过辩论机制降低单模型偏差，
            提供更全面、多维度的投资参考视角。
          </p>
        </Card>

        {/* Features */}
        <div>
          <h2 className="text-sm font-semibold mb-2">核心特性</h2>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="p-3 border-border/30">
                  <div className="flex items-start gap-2">
                    <Icon className="size-4 text-primary/70 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xs font-semibold">{f.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="text-sm font-semibold mb-2">技术栈</h2>
          <Card className="p-3 border-border/30">
            <div className="flex flex-wrap gap-1.5">
              {TECH_STACK.map((tech) => (
                <Badge key={tech} variant="outline" className="text-[10px]">
                  {tech}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* Disclaimers */}
        <Card className="p-4 border-red-500/15 bg-red-500/5">
          <h2 className="text-sm font-semibold text-red-400 mb-2">⚠️ 免责声明</h2>
          <ul className="space-y-1.5">
            {DISCLAIMERS.map((d, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-red-400/70 mt-0.5">•</span>
                {d}
              </li>
            ))}
          </ul>
        </Card>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-muted-foreground/50">
            AI 智投 v2.0.0-alpha · Built with ❤️ by AI &amp; Human Collaboration
          </p>
        </div>
      </div>
    </div>
  );
}
