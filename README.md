# AI 智投 — A股 Multi-Agent 智能投资分析平台

> 融合 2025-2026 年最前沿 AI 金融项目设计理念，8 位 AI 投资大师协作辩论，为 A 股投资者提供多维度的智能分析决策参考。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.13-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)

## ✨ 核心特性

### 🏛️ Multi-Agent 投资委员会 (旗舰功能)
- **8 位 AI 投资大师**：巴菲特、索罗斯、彼得·林奇、西蒙斯、达利欧、格雷厄姆、利弗莫尔、罗杰斯
- **5 阶段决策流程**：数据加载 → 大师并行分析 → 多空辩论 → 风控评估 → 主席综合判断
- **SSE 实时流式输出**：Token 级流式响应，所见即所得

### 📊 全方位行情数据
- A 股全市场 5850+ 只个股实时行情
- K 线图 + 分时图 + 多技术指标叠加（MA/MACD/KDJ/BOLL）
- 行业板块热力图 + 北向资金流向
- 财务基本面分析 + 同行业对比

### 🤖 AI 智能体矩阵
- **AI 对话**：自然语言问股，Markdown 流式回复
- **Deep Research**：AI 自主规划→数据收集→反思→撰写，专业报告生成
- **AI 选股**：多维度条件筛选，AI 智能评分
- **AI 盯盘**：自定义预警条件，实时监控
- **大师排行榜**：8 位大师历史战绩 PK + 雷达图

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 15 · TypeScript · Tailwind CSS v4      │
│  shadcn/ui · Lightweight Charts · Zustand       │
│  TanStack Query · NextAuth.js v5 · Drizzle ORM  │
└─────────────────┬───────────────────────────────┘
                  │ REST + SSE
┌─────────────────▼───────────────────────────────┐
│                  Backend                         │
│  FastAPI (Python 3.13) · cn-ashare · akshare   │
│  sse-starlette · OpenAI SDK · LangChain         │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                 Data Layer                       │
│  Neon PostgreSQL (Serverless) · Redis Cache      │
│  Drizzle ORM · 8 张核心数据表                    │
└─────────────────────────────────────────────────┘
```

## 📁 项目结构

```
ai-smart-invest/
├── src/                        # Next.js 前端
│   ├── app/                    # 18 页面路由 (App Router)
│   ├── components/             # UI + AI + Charts + Market
│   ├── hooks/                  # TanStack Query + AI Stream
│   ├── lib/                    # db-queries, ai-storage, rate-limit
│   ├── stores/                 # Zustand 状态管理
│   ├── types/                  # TypeScript 类型定义
│   └── db/                     # Drizzle ORM Schema + 连接
├── backend/                    # FastAPI 数据 + AI 服务
│   ├── routers/                # market.py (8 端点) + ai.py (5 端点)
│   ├── services/               # cn-ashare, akshare, LLM Provider
│   └── agents/                 # 8 位大师 System Prompt
└── specs/                      # SDD 规范文档
    └── 2026-05-07-ai-smart-invest/
```

## 🚀 快速开始

### 前置条件
- Node.js 20+
- Python 3.13+
- Neon PostgreSQL 数据库

### 环境变量

```bash
# Frontend (.env.local)
DATABASE_URL=postgresql://...
AUTH_SECRET=your-auth-secret
BACKEND_URL=http://localhost:8000/api/v1

# Backend (backend/.env)
OPENAI_API_KEY=sk-...         # 或 DEEPSEEK_API_KEY / QWEN_API_KEY
```

### 安装与启动

```bash
# 1. 安装前端依赖
npm install

# 2. 启动前端开发服务器
npm run dev

# 3. 安装后端依赖
cd backend
pip install -r requirements.txt

# 4. 启动后端服务
python main.py
```

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000/api/v1/health

## 🗄️ 数据库

```bash
# 初始化数据库表 (Drizzle ORM)
npx drizzle-kit push

# 生成迁移文件
npx drizzle-kit generate
```

8 张核心表：`users`, `watchlists`, `ai_sessions`, `ai_messages`, `ai_reports`, `master_stats`, `alerts`, `user_preferences`

## 📄 页面列表 (18 页)

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页仪表盘 | `/` | 三大指数 + 涨幅榜 + 自选股 |
| 实时行情 | `/market` | 全市场搜索+排序+虚拟滚动 |
| 股票详情 | `/stock/[code]` | K线+分时+技术指标+基本面 |
| 板块分析 | `/sectors` | 行业热力图+板块排行+北向资金 |
| **投资委员会 ★** | `/committee` | 8位大师分析+辩论+风控+主席决策 |
| AI 对话 | `/chat` | 自然语言问股+流式Markdown |
| Deep Research | `/deep-research` | AI自主调研+报告生成 |
| AI 选股 | `/screener` | 多维度筛选+AI评分 |
| AI 盯盘 | `/monitor` | 自定义预警+实时监控 |
| 大师排行榜 | `/leaderboard` | 8位大师战绩PK |
| 技术分析 | `/technical` | K线+多指标叠加面板 |
| 基本面分析 | `/fundamental` | 财务指标+同行业对比 |
| 分析历史 | `/history` | 历史会话列表+详情 |
| 自选股 | `/watchlist` | 自选股CRUD+实时汇总 |
| 关于 | `/about` | 项目介绍+技术栈+声明 |
| 登录 | `/login` | Credentials + JWT |
| 注册 | `/register` | 表单验证+bcrypt |
| 设置 | `/settings` | 个人资料+偏好配置 |

## 🌐 部署

- **前端**：Vercel (Next.js Edge Runtime)
- **后端**：Railway (Python FastAPI)
- **数据库**：Neon (Serverless PostgreSQL)

## ⚠️ 免责声明

本平台所有 AI 分析结果仅供参考学习，**不构成任何投资建议**。投资有风险，入市需谨慎。

## 📜 License

MIT License © 2026 AI Smart Invest
