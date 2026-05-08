"""
akShare 数据源 — 历史行情、基本面、板块分析、北向资金
GitHub: akfamily/akshare
"""
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    import akshare as ak  # type: ignore
    HAS_AKSHARE = True
except ImportError:
    HAS_AKSHARE = False
    logger.warning("akshare not installed")


def _normalize_date(date_str: Optional[str]) -> str:
    """Normalize date to YYYYMMDD format"""
    if not date_str:
        return datetime.now().strftime("%Y%m%d")
    return date_str.replace("-", "")


async def get_spot_all() -> list[dict]:
    """获取全市场 A 股实时行情快照（akShare 东方财富源）"""
    if not HAS_AKSHARE:
        return []

    try:
        df = ak.stock_zh_a_spot_em()
        if df is None or (hasattr(df, "empty") and df.empty):
            return []

        # Rename columns to English
        column_map = {
            "代码": "code",
            "名称": "name",
            "最新价": "price",
            "涨跌额": "change",
            "涨跌幅": "change_percent",
            "今开": "open",
            "昨收": "pre_close",
            "最高": "high",
            "最低": "low",
            "成交量": "volume",
            "成交额": "turnover",
            "换手率": "turnover_rate",
            "量比": "volume_ratio",
            "市盈率-动态": "pe",
            "市净率": "pb",
            "总市值": "total_market_value",
            "流通市值": "circulating_market_value",
            "60日涨跌幅": "change_60d",
        }
        df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})

        # Convert numeric columns
        for col in ["price", "change", "change_percent", "open", "high", "low",
                     "pre_close", "turnover", "turnover_rate", "volume_ratio"]:
            if col in df.columns:
                df[col] = df[col].astype(float)

        return df.to_dict("records")
    except Exception as e:
        logger.error(f"akshare get_spot_all failed: {e}")
        return []


async def get_kline_history(
    symbol: str,
    period: str = "daily",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> list[dict]:
    """
    获取 A 股历史 K 线数据
    symbol: 股票代码如 "000001" (平安银行)
    period: daily / weekly / monthly
    """
    if not HAS_AKSHARE:
        return []

    try:
        start = _normalize_date(start_date or "20250101")
        end = _normalize_date(end_date or datetime.now().strftime("%Y%m%d"))

        df = ak.stock_zh_a_hist(
            symbol=symbol,
            period=period,
            start_date=start,
            end_date=end,
            adjust="qfq",  # 前复权
        )

        if df is None or (hasattr(df, "empty") and df.empty):
            return []

        # Rename columns to English
        column_map = {
            "日期": "date",
            "开盘": "open",
            "收盘": "close",
            "最高": "high",
            "最低": "low",
            "成交量": "volume",
            "成交额": "turnover",
            "振幅": "amplitude",
            "涨跌幅": "change_percent",
            "涨跌额": "change",
            "换手率": "turnover_rate",
        }
        df = df.rename(columns=column_map)

        return df.to_dict("records")
    except Exception as e:
        logger.error(f"akshare get_kline({symbol}, {period}) failed: {e}")
        return []


async def get_stock_info(symbol: str) -> Optional[dict]:
    """获取个股基本信息（名称、行业、市值等）"""
    if not HAS_AKSHARE:
        return None

    try:
        df = ak.stock_individual_info_em(symbol=symbol)
        if df is None or df.empty:
            return None
        result = {}
        for _, row in df.iterrows():
            result[row["item"]] = row["value"]
        return result
    except Exception as e:
        logger.error(f"akshare get_stock_info({symbol}) failed: {e}")
        return None


async def get_sector_data() -> list[dict]:
    """获取行业板块行情数据"""
    if not HAS_AKSHARE:
        return []

    try:
        df = ak.stock_board_industry_name_em()
        if df is None:
            return []

        column_map = {
            "板块名称": "name",
            "最新价": "price",
            "涨跌幅": "change_percent",
            "总市值": "total_market_value",
            "换手率": "turnover_rate",
            "上涨家数": "up_count",
            "下跌家数": "down_count",
            "领涨股票": "lead_stock",
            "领涨股票-涨跌幅": "lead_change",
        }
        df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})
        return df.head(50).to_dict("records")
    except Exception as e:
        logger.error(f"akshare get_sector_data failed: {e}")
        return []


async def get_northbound_flow(
    days: int = 30,
) -> list[dict]:
    """获取北向资金流向历史"""
    if not HAS_AKSHARE:
        return []

    try:
        df = ak.stock_hsgt_north_net_flow_in_em(symbol="北上")
        if df is None:
            return []

        column_map = {
            "日期": "date",
            "当日净流入": "net_flow",
            "当日余额": "balance",
        }
        df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})
        return df.tail(days).to_dict("records")
    except Exception as e:
        logger.error(f"akshare get_northbound_flow failed: {e}")
        return []


async def get_fundamentals(symbol: str) -> Optional[dict]:
    """获取财务基本面数据"""
    if not HAS_AKSHARE:
        return None

    try:
        # Get main financial indicators
        df = ak.stock_financial_abstract_ths(symbol=symbol)
        if df is None or df.empty:
            return None
        return df.to_dict("records")
    except Exception as e:
        logger.error(f"akshare get_fundamentals({symbol}) failed: {e}")
        return None
