"""
Multi-Agent 编排引擎
投资委员会 — 8位大师分析 → 辩论 → 风控 → 主席总结 (SSE 流式)
"""
import asyncio
import json
import re
import time
from typing import AsyncIterator

from services.llm_provider import LLMProvider
from services.agents.master_prompts import (
    MASTERS,
    CHAIRMAN_PROMPT,
    get_master_prompt,
)
from services.context_builder import (
    build_stock_context,
    build_chat_context,
    build_deep_research_context,
)


def _parse_json_response(text: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    # Try to extract from markdown code block
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.DOTALL)
    if json_match:
        text = json_match.group(1).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object
    bracket_match = re.search(r"\{[\s\S]*\}", text)
    if bracket_match:
        try:
            return json.loads(bracket_match.group(0))
        except json.JSONDecodeError:
            pass

    return {"error": "failed_to_parse", "raw": text[:500]}


def _sse_event(event_type: str, data: dict) -> dict:
    """Format SSE event dict for sse-starlette."""
    return {"event": event_type, "data": json.dumps(data, ensure_ascii=False)}


async def committee_analysis_stream(
    stock_code: str,
    llm: LLMProvider | None = None,
) -> AsyncIterator[str]:
    """
    投资委员会全流程 SSE 流式分析：
    1. 数据加载
    2. 8位大师并行分析
    3. 辩论阶段
    4. 风控评估
    5. 主席总结
    """
    if llm is None:
        llm = LLMProvider.from_env()

    # Phase 1: Load stock data
    yield _sse_event("init", {
        "sessionId": f"committee_{stock_code}_{int(time.time())}",
        "stockCode": stock_code,
    })

    yield _sse_event("data_loading", {
        "progress": 0.1,
        "message": "正在获取实时行情数据...",
    })

    try:
        stock_context = await build_stock_context(stock_code)
    except Exception as e:
        yield _sse_event("error", {"message": f"数据获取失败: {str(e)}"})
        return

    yield _sse_event("data_loading", {
        "progress": 0.3,
        "message": "数据加载完成，启动8位AI投资大师分析...",
    })

    # Phase 2: 8 masters analyze in parallel
    master_results: list[dict] = []
    for i, master in enumerate(MASTERS):
        try:
            messages = get_master_prompt(master["id"], stock_context)
            response = await llm.chat(messages, temperature=0.8, max_tokens=1024)
            result = _parse_json_response(response)

            result.setdefault("master", master["name"])
            result.setdefault("avatar", master["avatar"])
            result.setdefault("style", master["style"])
            result.setdefault("stance", "neutral")
            result.setdefault("confidence", 0.5)
            result.setdefault("reasoning", response[:300])
            result["order"] = i + 1

            master_results.append(result)

            yield _sse_event("master_analysis", result)
        except Exception as e:
            yield _sse_event("master_analysis", {
                "master": master["name"],
                "avatar": master["avatar"],
                "style": master["style"],
                "stance": "neutral",
                "confidence": 0.0,
                "reasoning": f"分析失败: {str(e)}",
                "order": i + 1,
                "error": str(e),
            })

    # Phase 3: Debate (bulls vs bears)
    bulls = [m for m in master_results if m.get("stance") == "bullish"]
    bears = [m for m in master_results if m.get("stance") == "bearish"]
    neutrals = [m for m in master_results if m.get("stance") == "neutral"]

    yield _sse_event("debate_start", {
        "bullCount": len(bulls),
        "bearCount": len(bears),
        "neutralCount": len(neutrals),
    })

    # Debate round 1: Bulls vs Bears
    if bulls and bears:
        yield _sse_event("debate_round", {
            "round": 1,
            "title": "第一轮辩论：看多 vs 看空",
            "bulls": [f"{m['master']}: {m.get('reasoning', '无')[:200]}" for m in bulls],
            "bears": [f"{m['master']}: {m.get('reasoning', '无')[:200]}" for m in bears],
        })

        # Round 2: AI-synthesized debate
        try:
            debate_prompt = f"""以下是关于同一只股票的8位投资大师的分析结果。请模拟一场精彩的辩论：

看多方 ({len(bulls)}位)：
{json.dumps([{"name": m["master"], "view": m["reasoning"]} for m in bulls], ensure_ascii=False)}

看空方 ({len(bears)}位)：
{json.dumps([{"name": m["master"], "view": m["reasoning"]} for m in bears], ensure_ascii=False)}

请以JSON格式输出第二轮辩论的核心交锋点：
```json
{{
  "keyDebates": [
    {{"topic": "争议点", "bullView": "看多方观点", "bearView": "看空方观点"}}
  ],
  "resolvedPoints": ["已达成共识的点"],
  "unresolvedPoints": ["未解决的分歧"]
}}
```"""
            debate_response = await llm.chat(
                [{"role": "user", "content": debate_prompt}],
                temperature=0.6,
                max_tokens=800,
            )
            debate_result = _parse_json_response(debate_response)

            yield _sse_event("debate_round", {
                "round": 2,
                "title": "第二轮辩论：核心交锋",
                **debate_result,
            })
        except Exception as e:
            yield _sse_event("debate_round", {
                "round": 2,
                "title": "第二轮辩论",
                "error": str(e),
            })

    # Phase 4: Risk assessment
    yield _sse_event("risk_assessing", {"message": "正在进行风险评估..."})

    try:
        risk_prompt = f"""基于以下分析结果，评估该股票的投资风险等级：

分析结果：
{json.dumps(master_results, ensure_ascii=False, indent=2)}

请以JSON格式输出风险评估：
```json
{{
  "riskLevel": "low|medium|high|extreme",
  "risks": ["具体风险1", "具体风险2", "具体风险3"],
  "riskScore": 0-100,
  "mitigation": ["风险缓释措施1", "风险缓释措施2"]
}}
```"""
        risk_response = await llm.chat(
            [{"role": "user", "content": risk_prompt}],
            temperature=0.3,
            max_tokens=600,
        )
        risk_result = _parse_json_response(risk_response)
        yield _sse_event("risk_assessment", risk_result)
    except Exception as e:
        yield _sse_event("risk_assessment", {
            "riskLevel": "medium",
            "risks": ["AI评估失败"],
            "error": str(e),
        })

    # Phase 5: Chairman summary
    yield _sse_event("chairman_summarizing", {"message": "投委会主席正在综合各方意见..."})

    try:
        chairman_messages = [
            {"role": "system", "content": CHAIRMAN_PROMPT},
            {"role": "user", "content": f"""以下是8位投资大师的分析结果，请给出最终判断：

股票信息：
{stock_context[:500]}

大师分析结果：
{json.dumps(master_results, ensure_ascii=False, indent=2)}

风险评估：
{json.dumps(risk_result if 'risk_result' in dir() else {}, ensure_ascii=False)}

请给出你的最终判断。只输出JSON。"""}
        ]
        chairman_response = await llm.chat(chairman_messages, temperature=0.5, max_tokens=800)
        chairman_result = _parse_json_response(chairman_response)
        chairman_result["sessionId"] = f"committee_{stock_code}_{int(time.time())}"
        yield _sse_event("chairman_summary", chairman_result)
    except Exception as e:
        yield _sse_event("chairman_summary", {
            "recommendation": "hold",
            "confidence": 0.5,
            "summary": f"分析异常: {str(e)}",
        })

    yield _sse_event("done", {"message": "投资委员会分析完成"})


async def ai_chat_stream(
    query: str,
    stock_code: str | None = None,
    llm: LLMProvider | None = None,
) -> AsyncIterator[str]:
    """AI 对话 (SSE 流式)"""
    if llm is None:
        llm = LLMProvider.from_env()

    context = await build_chat_context(query, stock_code)

    messages = [
        {
            "role": "system",
            "content": """你是AI智投的智能助手，专注于A股市场分析。

能力范围：
- A股个股分析（基本面、技术面、资金面）
- 行业板块分析
- 宏观经济解读
- 投资策略建议（不构成投资建议）
- 实时行情解读

回答风格：
- 专业但易懂
- 用数据说话
- 标注信息来源
- 风险提示
- 支持Markdown格式""",
        },
        {"role": "user", "content": context},
    ]

    yield _sse_event("chat_start", {"query": query})

    try:
        async for token in llm.chat_stream(messages, temperature=0.7, max_tokens=1500):
            yield _sse_event("token", {"content": token})
    except Exception as e:
        yield _sse_event("error", {"message": str(e)})

    yield _sse_event("done", {})


async def deep_research_stream(
    topic: str,
    stock_codes: list[str] | None = None,
    llm: LLMProvider | None = None,
) -> AsyncIterator[str]:
    """Deep Research 自主调研 (4步流程 + SSE)"""
    if llm is None:
        llm = LLMProvider.from_env()

    session_id = f"dr_{int(time.time())}"
    yield _sse_event("init", {"sessionId": session_id, "topic": topic})

    # Step 1: Plan
    yield _sse_event("step", {"step": 1, "name": "规划阶段", "message": "正在制定调研计划..."})

    plan_prompt = f"""你是一个金融研究分析师。请为主题「{topic}」制定一个全面的调研计划。

输出JSON格式：
```json
{{
  "researchPlan": [
    {{"phase": "阶段名", "questions": ["需要回答的问题"], "dataNeeded": ["需要的数据"]}}
  ],
  "estimatedDepth": "浅/中/深",
  "keyHypothesis": ["核心假设"]
}}
```"""
    plan_response = await llm.chat(
        [{"role": "user", "content": plan_prompt}],
        temperature=0.5,
        max_tokens=500,
    )
    plan = _parse_json_response(plan_response)
    yield _sse_event("plan", plan)

    # Step 2: Execute — gather data
    yield _sse_event("step", {"step": 2, "name": "执行阶段", "message": "正在收集相关数据..."})

    context = await build_deep_research_context(topic, stock_codes)
    yield _sse_event("data_collected", {
        "message": "数据收集完成",
        "sources": ["实时行情", "基本面数据", "市场环境"],
    })

    # Step 3: Reflect — iterate if needed
    yield _sse_event("step", {"step": 3, "name": "反思阶段", "message": "正在深度分析数据..."})

    reflect_prompt = f"""基于以下数据，对主题「{topic}」进行深度反思分析。

数据：
{context[:3000]}

请识别：
1. 信息是否充分
2. 是否有需要深入的方向
3. 主要发现和Insight

输出JSON：
```json
{{
  "sufficient": true/false,
  "gaps": ["数据缺口"],
  "keyFindings": ["主要发现1", "主要发现2"],
  "insights": ["深度洞察1", "深度洞察2"]
}}
```"""
    reflect_response = await llm.chat(
        [{"role": "user", "content": reflect_prompt}],
        temperature=0.4,
        max_tokens=500,
    )
    reflection = _parse_json_response(reflect_response)
    yield _sse_event("reflection", reflection)

    # Step 4: Write report
    yield _sse_event("step", {"step": 4, "name": "撰写阶段", "message": "正在生成研究报告..."})

    write_prompt = f"""请为主题「{topic}」撰写一份专业的A股投资研究报告。

数据基础：
{context[:3000]}

研究计划：
{json.dumps(plan, ensure_ascii=False)[:500]}

反思发现：
{json.dumps(reflection, ensure_ascii=False)[:500]}

报告格式要求：
- 使用Markdown
- 包含：摘要、背景、数据分析、核心发现、风险提示、结论
- 专业、客观、数据驱动
- 添加免责声明
"""
    yield _sse_event("report_writing", {"message": "生成报告中..."})

    try:
        async for token in llm.chat_stream(
            [{"role": "user", "content": write_prompt}],
            temperature=0.6,
            max_tokens=2000,
        ):
            yield _sse_event("token", {"content": token})
    except Exception as e:
        yield _sse_event("error", {"message": str(e)})

    yield _sse_event("done", {"sessionId": session_id})


async def ai_screener_stream(
    filters: dict,
    llm: LLMProvider | None = None,
) -> AsyncIterator[str]:
    """AI 智能选股"""
    if llm is None:
        llm = LLMProvider.from_env()

    yield _sse_event("screener_start", {"filters": filters})

    screener_prompt = f"""你是一位量化选股专家。请根据以下条件，从A股市场筛选符合条件的股票：

筛选条件：
{json.dumps(filters, ensure_ascii=False, indent=2)}

请输出JSON格式的选股结果：
```json
{{
  "results": [
    {{
      "code": "股票代码",
      "name": "股票名称",
      "matchScore": 0-100,
      "reasons": ["匹配原因1", "匹配原因2"],
      "keyMetrics": {{"pe": 0, "roe": 0, "marketCap": "..."}},
      "riskNote": "风险提示"
    }}
  ],
  "totalMatches": 0,
  "screeningLogic": "筛选逻辑说明",
  "disclaimer": "免责声明"
}}
```
最多返回10只最匹配的股票。"""

    response = await llm.chat(
        [{"role": "user", "content": screener_prompt}],
        temperature=0.4,
        max_tokens=1500,
    )
    result = _parse_json_response(response)

    yield _sse_event("results", result)
    yield _sse_event("done", {})


async def leaderboard_data(
    llm: LLMProvider | None = None,
) -> dict:
    """获取大师排行榜（含模拟历史战绩统计）"""
    if llm is None:
        try:
            llm = LLMProvider.from_env()
        except ValueError:
            # No LLM configured, return static data
            return _static_leaderboard()

    try:
        prompt = """请以JSON格式输出一份AI投资大师的模拟历史战绩排行榜（模拟数据，仅供娱乐和教学参考）：
8位大师：巴菲特、索罗斯、彼得·林奇、西蒙斯、达利欧、格雷厄姆、利弗莫尔、罗杰斯

输出JSON：
```json
{
  "rankings": [
    {
      "master": "大师名",
      "avatar": "头像路径",
      "rank": 排名,
      "accuracy": 准确率(0-1),
      "totalCalls": 总推荐次数,
      "avgReturn": 平均收益(%),
      "bestCall": {"stock": "最佳推荐股票", "return": 收益%},
      "specialty": ["擅长领域"],
      "recentPerformance": "最近表现评价"
    }
  ],
  "updatedAt": "更新时间"
}
```"""
        response = await llm.chat(
            [{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800,
        )
        return _parse_json_response(response)
    except Exception:
        return _static_leaderboard()


def _static_leaderboard() -> dict:
    """Static leaderboard fallback."""
    return {
        "rankings": [
            {"master": "沃伦·巴菲特", "avatar": "/avatars/buffett.png", "rank": 1,
             "accuracy": 0.72, "totalCalls": 156, "avgReturn": 18.5,
             "bestCall": {"stock": "贵州茅台", "return": 45.2},
             "specialty": ["价值投资", "消费行业"], "recentPerformance": "近3月推荐准确率78%"},
            {"master": "彼得·林奇", "avatar": "/avatars/lynch.png", "rank": 2,
             "accuracy": 0.68, "totalCalls": 203, "avgReturn": 22.1,
             "bestCall": {"stock": "宁德时代", "return": 68.3},
             "specialty": ["成长投资", "科技行业"], "recentPerformance": "近3月推荐准确率71%"},
            {"master": "瑞·达利欧", "avatar": "/avatars/dalio.png", "rank": 3,
             "accuracy": 0.65, "totalCalls": 98, "avgReturn": 12.8,
             "bestCall": {"stock": "招商银行", "return": 25.7},
             "specialty": ["宏观对冲", "金融行业"], "recentPerformance": "近3月推荐准确率69%"},
            {"master": "詹姆斯·西蒙斯", "avatar": "/avatars/simons.png", "rank": 4,
             "accuracy": 0.63, "totalCalls": 312, "avgReturn": 15.2,
             "bestCall": {"stock": "中芯国际", "return": 35.8},
             "specialty": ["量化分析", "半导体"], "recentPerformance": "近3月推荐准确率66%"},
            {"master": "本杰明·格雷厄姆", "avatar": "/avatars/graham.png", "rank": 5,
             "accuracy": 0.61, "totalCalls": 87, "avgReturn": 10.5,
             "bestCall": {"stock": "中国平安", "return": 20.1},
             "specialty": ["安全边际", "保险金融"], "recentPerformance": "近3月推荐准确率64%"},
            {"master": "吉姆·罗杰斯", "avatar": "/avatars/rogers.png", "rank": 6,
             "accuracy": 0.58, "totalCalls": 67, "avgReturn": 16.3,
             "bestCall": {"stock": "紫金矿业", "return": 42.1},
             "specialty": ["逆向投资", "资源行业"], "recentPerformance": "近3月推荐准确率60%"},
            {"master": "乔治·索罗斯", "avatar": "/avatars/soros.png", "rank": 7,
             "accuracy": 0.55, "totalCalls": 112, "avgReturn": 11.2,
             "bestCall": {"stock": "比亚迪", "return": 55.6},
             "specialty": ["宏观对冲", "新能源"], "recentPerformance": "近3月推荐准确率52%"},
            {"master": "杰西·利弗莫尔", "avatar": "/avatars/livermore.png", "rank": 8,
             "accuracy": 0.52, "totalCalls": 245, "avgReturn": 8.9,
             "bestCall": {"stock": "东方财富", "return": 30.5},
             "specialty": ["趋势交易", "券商股"], "recentPerformance": "近3月推荐准确率55%"},
        ],
        "updatedAt": "2026-05-09 00:00:00",
    }
