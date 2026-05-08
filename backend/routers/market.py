"""
行情数据路由器 — A 股实时行情、K 线、分时、板块、北向资金
双数据源: cn-ashare Ashare.py (实时) + akShare (历史/全市场/基本面)
"""
import logging
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Query, Path
from pydantic import BaseModel

from services import (
    get_indices as svc_get_indices,
    get_stock_spot as svc_get_stock_spot,
    get_kline_data as svc_get_kline,
    get_minute_data as svc_get_minute,
    get_spot_all as svc_get_spot_all,
    get_kline_history as svc_get_kline_history,
    get_stock_info as svc_get_stock_info,
    get_sector_data as svc_get_sector_data,
    get_northbound_flow as svc_get_northbound_flow,
    get_fundamentals as svc_get_fundamentals,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _ensure_dates(items: list[dict]) -> list[dict]:
    """Ensure each kline item has a 'date' field. Generate synthetic dates if missing."""
    if not items:
        return items
    today = datetime.now()
    for i, item in enumerate(items):
        if "date" not in item or not item["date"]:
            item["date"] = (today - timedelta(days=len(items) - 1 - i)).strftime("%Y-%m-%d")
    return items


# ===== Fallback Data =====

FALLBACK_INDICES = [
    {"code": "000001", "name": "上证综指", "price": 3247.82, "change": 18.56, "change_percent": 0.58},
    {"code": "399001", "name": "深证成指", "price": 11034.55, "change": 135.22, "change_percent": 1.24},
    {"code": "399006", "name": "创业板指", "price": 2156.33, "change": -6.89, "change_percent": -0.32},
    {"code": "000300", "name": "沪深300", "price": 3891.45, "change": 15.93, "change_percent": 0.41},
]


# ===== Endpoints =====

@router.get("/indices")
async def get_indices():
    """获取三大指数（上证、深证、创业板、沪深300）实时行情"""
    try:
        data = await svc_get_indices()
        if data:
            return {"success": True, "data": data}
    except Exception as e:
        logger.warning(f"Indices live fetch failed, using fallback: {e}")

    return {"success": True, "data": FALLBACK_INDICES, "source": "fallback"}


@router.get("/spot")
async def get_spot(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    sort: str = Query("change_percent", description="排序字段"),
    order: str = Query("desc", description="排序方向: asc / desc"),
):
    """获取全市场 A 股实时行情（分页）"""
    try:
        all_data = await svc_get_spot_all()
        if all_data:
            # Sort
            if sort in ["change_percent", "volume", "turnover", "price", "pe", "pb"]:
                reverse = order == "desc"
                all_data.sort(
                    key=lambda x: float(x.get(sort, 0) or 0),
                    reverse=reverse,
                )

            total = len(all_data)
            start = (page - 1) * size
            end = start + size
            page_data = all_data[start:end]

            return {
                "success": True,
                "data": page_data,
                "meta": {
                    "page": page,
                    "page_size": size,
                    "total": total,
                    "pages": (total + size - 1) // size,
                },
            }
    except Exception as e:
        logger.warning(f"Spot fetch failed: {e}")

    return {"success": True, "data": [], "meta": {"page": page, "page_size": size, "total": 0}}


@router.get("/stock/{code}")
async def get_stock(code: str = Path(..., description="股票代码，如 000001 或 sh600519")):
    """获取个股实时行情 + 基本信息"""
    spot = await svc_get_stock_spot(code)
    info = await svc_get_stock_info(code)

    # If Ashare spot failed, try akShare for latest price from spot_all
    if not spot:
        all_spots = await svc_get_spot_all()
        for s in all_spots:
            if str(s.get("code", "")) == code:
                spot = s
                break

    return {
        "success": True,
        "data": {
            "code": code,
            "spot": spot,
            "info": info,
        },
    }


@router.get("/kline/{code}")
async def get_kline(
    code: str = Path(..., description="股票代码"),
    period: str = Query("daily", description="周期: daily/weekly/monthly"),
    start: Optional[str] = Query(None, description="起始日期 YYYYMMDD"),
    end: Optional[str] = Query(None, description="结束日期 YYYYMMDD"),
    limit: int = Query(250, ge=1, le=1000, description="返回数据条数上限"),
):
    """获取历史 K 线数据"""
    # Try akShare first (has richer data), fallback to Ashare
    data = await svc_get_kline_history(
        symbol=code,
        period=period,
        start_date=start,
        end_date=end,
    )

    if not data:
        # Fallback to Ashare
        freq_map = {"daily": "1d", "weekly": "1w", "monthly": "1M"}
        data = await svc_get_kline(
            code=code,
            frequency=period,
            count=limit,
        )

    if len(data) > limit:
        data = data[-limit:]

    data = _ensure_dates(data)

    return {
        "success": True,
        "data": data,
        "meta": {"code": code, "period": period, "count": len(data)},
    }


@router.get("/minute/{code}")
async def get_minute(
    code: str = Path(..., description="股票代码"),
    freq: str = Query("5m", description="分时频率: 1m/5m/15m/30m/60m"),
    count: int = Query(240, ge=1, le=480, description="返回点数"),
):
    """获取当日分时/分钟 K 线数据"""
    data = await svc_get_minute(code, freq=freq, count=count)
    data = _ensure_dates(data)
    return {"success": True, "data": data}


@router.get("/sectors")
async def get_sectors():
    """获取行业板块行情"""
    data = await svc_get_sector_data()
    return {"success": True, "data": data}


@router.get("/northbound")
async def get_northbound(
    days: int = Query(30, ge=1, le=365, description="返回天数"),
):
    """获取北向资金流向"""
    data = await svc_get_northbound_flow(days=days)
    return {"success": True, "data": data}


@router.get("/fundamentals/{code}")
async def get_fundamentals(code: str = Path(..., description="股票代码")):
    """获取财务基本面数据"""
    data = await svc_get_fundamentals(symbol=code)
    return {"success": True, "data": data}
