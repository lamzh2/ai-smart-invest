"""
Context Builder — 为 AI Agent 构建带股票数据的分析上下文
"""
import json
from typing import Any

from services.cn_ashare_service import get_stock_spot, get_kline_data
from services.akshare_service import get_spot_all, get_fundamentals


def _safe_get(coro_result: Any, default: Any = None) -> Any:
    """Safe unwrap of a coroutine-like or direct result."""
    return coro_result if coro_result is not None else default


async def build_stock_context(stock_code: str) -> str:
    """
    构建 AI 分析所需的完整股票上下文。
    包含：实时行情、近期K线、基本面、板块信息。
    """
    parts: list[str] = []

    # 1. 实时行情
    try:
        spot = await get_stock_spot(stock_code)
        if spot:
            parts.append(f"""## 实时行情
- 股票代码: {spot.get('code', stock_code)}
- 股票名称: {spot.get('name', '未知')}
- 最新价: {spot.get('price', 'N/A')}
- 涨跌幅: {spot.get('change_percent', 'N/A')}%
- 涨跌额: {spot.get('change', 'N/A')}
- 最高价: {spot.get('high', 'N/A')}
- 最低价: {spot.get('low', 'N/A')}
- 开盘价: {spot.get('open', 'N/A')}
- 昨收价: {spot.get('pre_close', 'N/A')}
- 成交量: {spot.get('volume', 'N/A')}手
- 成交额: {spot.get('amount', 'N/A')}元
- 换手率: {spot.get('turnover', 'N/A')}%
- 总市值: {spot.get('market_cap', 'N/A')}
- 流通市值: {spot.get('float_market_cap', 'N/A')}
- 市盈率(TTM): {spot.get('pe', 'N/A')}
- 市净率: {spot.get('pb', 'N/A')}""")
    except Exception as e:
        parts.append(f"## 实时行情\n获取失败: {e}")

    # 2. 近期K线 (最近60个交易日)
    try:
        kline = await get_kline_data(stock_code, period="daily", limit=60)
        if kline and len(kline) > 0:
            # Recent 5 days for summary
            recent = kline[-5:] if len(kline) >= 5 else kline
            kline_summary = "\n".join(
                f"  - {k.get('date', '?')}: 开{k.get('open','?')} 高{k.get('high','?')} "
                f"低{k.get('low','?')} 收{k.get('close','?')} "
                f"量{k.get('volume','?')}"
                for k in recent
            )

            # Calculate simple stats
            closes = [float(k.get("close", 0)) for k in kline if k.get("close")]
            ma5 = sum(closes[-5:]) / min(len(closes), 5) if closes else 0
            ma20 = sum(closes[-20:]) / min(len(closes), 20) if len(closes) >= 20 else sum(closes) / len(closes) if closes else 0
            high_60 = max(closes) if closes else 0
            low_60 = min(closes) if closes else 0

            parts.append(f"""## 近期K线走势 (近60日)
- MA5: {ma5:.2f}
- MA20: {ma20:.2f}
- 60日最高: {high_60:.2f}
- 60日最低: {low_60:.2f}
- 近5日走势:
{kline_summary}""")
    except Exception as e:
        parts.append(f"## 近期K线\n获取失败: {e}")

    # 3. 基本面 (财务数据)
    try:
        fundamentals = await get_fundamentals(stock_code)
        if fundamentals:
            parts.append(f"""## 基本面数据
- 每股收益(EPS): {fundamentals.get('eps', 'N/A')}
- 每股净资产(BPS): {fundamentals.get('bps', 'N/A')}
- 净资产收益率(ROE): {fundamentals.get('roe', 'N/A')}%
- 营业收入: {fundamentals.get('revenue', 'N/A')}
- 净利润: {fundamentals.get('net_profit', 'N/A')}
- 收入同比增长: {fundamentals.get('revenue_yoy', 'N/A')}%
- 净利润同比增长: {fundamentals.get('profit_yoy', 'N/A')}%
- 资产负债率: {fundamentals.get('debt_ratio', 'N/A')}%
- 毛利率: {fundamentals.get('gross_margin', 'N/A')}%
- 净利率: {fundamentals.get('net_margin', 'N/A')}%""")
    except Exception as e:
        parts.append(f"## 基本面数据\n获取失败: {e}")

    # 4. 市场环境
    try:
        spot_all = await get_spot_all()
        if spot_all is not None and hasattr(spot_all, "__len__") and len(spot_all) > 0:
            up_count = sum(1 for s in spot_all if float(s.get("change_percent", 0) or 0) > 0)
            down_count = len(spot_all) - up_count
            parts.append(f"""## 整体市场环境
- A股上涨家数: {up_count}
- A股下跌家数: {down_count}
- 市场情绪: {"偏乐观" if up_count > down_count * 1.5 else "偏悲观" if down_count > up_count * 1.5 else "中性"}""")
    except Exception:
        parts.append("## 整体市场环境\n获取失败")

    return "\n\n".join(parts)


async def build_chat_context(query: str, stock_code: str | None = None) -> str:
    """Build context for general AI chat (optionally with a stock)."""
    if stock_code:
        return await build_stock_context(stock_code)
    return f"用户问题: {query}\n\n请在A股市场框架内回答。"


async def build_deep_research_context(topic: str, stock_codes: list[str] | None = None) -> str:
    """Build deep research context with multiple stocks."""
    parts = [f"# 研究主题: {topic}\n"]

    if stock_codes:
        for code in stock_codes[:5]:  # Max 5 stocks
            parts.append(f"\n---\n")
            parts.append(await build_stock_context(code))
    else:
        # Market overview only
        try:
            spot_all = await get_spot_all()
            if spot_all is not None and hasattr(spot_all, "__len__"):
                parts.append(f"\n当前A股总数: {len(spot_all)}只")
        except Exception:
            pass

    return "\n".join(parts)
