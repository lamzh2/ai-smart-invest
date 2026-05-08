"""
cn-ashare 实时行情数据源（新浪/腾讯双源）
GitHub: exusmkt/cn-ashare — Ashare.py 本地副本
"""
import logging
from typing import Optional
from datetime import datetime, date

logger = logging.getLogger(__name__)

# Use local Ashare.py (copied from cn-ashare repo)
try:
    from services.Ashare import get_price, get_price_async  # type: ignore
    HAS_ASHARE = True
except ImportError as e:
    HAS_ASHARE = False
    logger.warning(f"Ashare module not available: {e}")


def normalize_code(code: str) -> str:
    """Normalize stock code to Ashare format (sh600000 / sz000001)"""
    code = code.strip().upper()
    if code.lower().startswith(("sh", "sz")):
        return code.lower()
    if code.startswith("6"):
        return f"sh{code}"
    if code.startswith(("0", "3", "2")):
        return f"sz{code}"
    return code


def _df_to_records(df) -> list[dict]:
    """Convert DataFrame to list of dicts, normalizing column names."""
    if df is None or (hasattr(df, "empty") and df.empty):
        return []
    records = df.to_dict("records") if hasattr(df, "to_dict") else []
    # Normalize keys: Ashare uses 'time' or 'day' as date column
    for r in records:
        for k in list(r.keys()):
            if k.lower() in ("time", "day"):
                r["date"] = str(r.pop(k))
    return records


async def get_stock_spot(code: str) -> Optional[dict]:
    """获取单只股票最新行情（用当日日线最后一条）"""
    normalized = normalize_code(code)
    if not HAS_ASHARE:
        return None

    try:
        # Get latest 1 daily bar
        df = get_price(normalized, frequency="1d", count=1)
        records = _df_to_records(df)
        if not records:
            return None

        rec = records[0]
        # Map Ashare columns to our standard spot format
        return {
            "code": code,
            "name": "",  # Ashare doesn't return name
            "price": float(rec.get("close", 0)),
            "open": float(rec.get("open", 0)),
            "high": float(rec.get("high", 0)),
            "low": float(rec.get("low", 0)),
            "pre_close": float(rec.get("open", 0)),  # approximate
            "change": 0.0,
            "change_percent": 0.0,
            "volume": int(float(rec.get("volume", 0))),
            "date": rec.get("date", ""),
        }
    except Exception as e:
        logger.error(f"Ashare get_stock_spot({code}) failed: {e}")
        return None


async def get_minute_data(code: str, freq: str = "5m", count: int = 240) -> list[dict]:
    """获取分时/分钟 K 线数据"""
    normalized = normalize_code(code)
    if not HAS_ASHARE:
        return []

    try:
        df = get_price(normalized, frequency=freq, count=count)
        return _df_to_records(df)
    except Exception as e:
        logger.error(f"Ashare get_minute({code}) failed: {e}")
        return []


async def get_kline_data(code: str, frequency: str = "1d", count: int = 250) -> list[dict]:
    """获取 K 线数据（通过 Ashare 获取，支持 1d/1w/1M）"""
    normalized = normalize_code(code)
    if not HAS_ASHARE:
        return []

    # Map our period names to Ashare frequency
    freq_map = {"daily": "1d", "weekly": "1w", "monthly": "1M"}
    freq = freq_map.get(frequency, "1d")

    try:
        df = get_price(normalized, frequency=freq, count=count)
        return _df_to_records(df)
    except Exception as e:
        logger.error(f"Ashare get_kline({code}, {freq}) failed: {e}")
        return []


async def get_indices() -> list[dict]:
    """获取三大指数 + 沪深300 实时行情"""
    index_codes = {
        "sh000001": "上证综指",
        "sz399001": "深证成指",
        "sz399006": "创业板指",
        "sh000300": "沪深300",
    }

    if not HAS_ASHARE:
        return []

    results = []
    for code, name in index_codes.items():
        try:
            df = get_price(code, frequency="1d", count=1)
            records = _df_to_records(df)
            if records:
                rec = records[0]
                price = float(rec.get("close", 0))
                open_p = float(rec.get("open", 0))
                results.append({
                    "code": code.replace("sh", "").replace("sz", ""),
                    "name": name,
                    "price": price,
                    "change": round(price - open_p, 2),
                    "change_percent": round((price - open_p) / open_p * 100, 2) if open_p else 0,
                })
        except Exception as e:
            logger.error(f"Ashare index {code} failed: {e}")

    return results
