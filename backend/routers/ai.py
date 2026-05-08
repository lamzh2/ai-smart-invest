"""
AI 分析路由器 — Multi-Agent 投资委员会、AI 对话、Deep Research、选股、大师排行榜
全部端点支持 SSE 流式响应
"""
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from services.agent_orchestrator import (
    committee_analysis_stream,
    ai_chat_stream,
    deep_research_stream,
    ai_screener_stream,
    leaderboard_data,
)

router = APIRouter()


# ========== Request Models ==========

class CommitteeRequest(BaseModel):
    stock_code: str
    model: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    stock_code: Optional[str] = None
    model: Optional[str] = None


class DeepResearchRequest(BaseModel):
    topic: str
    stock_codes: Optional[list[str]] = None
    model: Optional[str] = None


class ScreenerRequest(BaseModel):
    filters: dict
    model: Optional[str] = None


# ========== SSE Headers ==========

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


# ========== 投资委员会 (旗舰功能) ==========

@router.post("/committee")
async def committee_analysis(req: CommitteeRequest):
    """
    投资委员会 Multi-Agent 分析 (SSE 流式)
    
    流程: 数据加载 → 8位大师分析 → 辩论 → 风控 → 主席总结
    Event types: init, data_loading, master_analysis, debate_start,
                 debate_round, risk_assessing, risk_assessment,
                 chairman_summarizing, chairman_summary, done, error
    """
    if not req.stock_code or len(req.stock_code.strip()) < 5:
        raise HTTPException(400, "请提供有效的股票代码")

    async def event_generator():
        try:
            async for sse_dict in committee_analysis_stream(req.stock_code):
                yield sse_dict
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"分析失败: {str(e)}"}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator(), headers=SSE_HEADERS)


# ========== AI 对话 ==========

@router.post("/chat")
async def ai_chat(req: ChatRequest):
    """
    AI 对话 (SSE 流式 Markdown)
    
    Event types: chat_start, token, done, error
    """
    if not req.query.strip():
        raise HTTPException(400, "请输入问题")

    async def event_generator():
        try:
            async for sse_dict in ai_chat_stream(req.query, req.stock_code):
                yield sse_dict
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"对话异常: {str(e)}"}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator(), headers=SSE_HEADERS)


# ========== Deep Research ==========

@router.post("/deep-research")
async def deep_research(req: DeepResearchRequest):
    """
    Deep Research 自主调研 (SSE 流式)
    
    流程: 规划 → 执行 → 反思 → 撰写 (4步)
    Event types: init, step, plan, data_collected, reflection,
                 report_writing, token, done, error
    """
    if not req.topic.strip():
        raise HTTPException(400, "请输入研究主题")

    async def event_generator():
        try:
            async for sse_dict in deep_research_stream(req.topic, req.stock_codes):
                yield sse_dict
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"研究异常: {str(e)}"}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator(), headers=SSE_HEADERS)


# ========== AI 选股 ==========

@router.post("/screener")
async def ai_screener(req: ScreenerRequest):
    """AI 智能选股 (SSE 流式)"""
    if not req.filters:
        raise HTTPException(400, "请提供筛选条件")

    async def event_generator():
        try:
            async for sse_dict in ai_screener_stream(req.filters):
                yield sse_dict
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"选股异常: {str(e)}"}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator(), headers=SSE_HEADERS)


# ========== 大师排行榜 ==========

@router.get("/leaderboard")
async def leaderboard():
    """获取大师排行榜（含模拟历史战绩）"""
    try:
        data = await leaderboard_data()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": f"获取排行榜失败: {str(e)}", "data": None}
