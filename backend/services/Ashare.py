# -*- coding:utf-8 -*-
"""
Ashare 股票行情数据双核心版 - 改进版
Ashare Stock Market Data Dual-Core Version - Improved

改进点 / Improvements:
1. 添加类型提示 / Added type hints
2. 改进错误处理 / Improved error handling
3. 支持异步操作 / Support for async operations
4. 添加配置管理 / Added configuration management
5. 更好的代码结构 / Better code structure
6. 添加日志记录 / Added logging
7. 添加重试机制 / Added retry mechanism
8. 数据验证 / Data validation
"""

import asyncio
import datetime
import json
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Union

import aiohttp
import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 配置日志 / Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataSource(Enum):
    """数据源枚举 / Data source enumeration"""

    SINA = "sina"
    TENCENT = "tencent"


class Frequency(Enum):
    """频率枚举 / Frequency enumeration"""

    MIN_1 = "1m"
    MIN_5 = "5m"
    MIN_15 = "15m"
    MIN_30 = "30m"
    MIN_60 = "60m"
    DAILY = "1d"
    WEEKLY = "1w"
    MONTHLY = "1M"


@dataclass
class ApiConfig:
    """API配置类 / API configuration class"""

    timeout: int = 30
    retries: int = 3
    backoff_factor: float = 0.3
    status_forcelist: List[int] = field(default_factory=lambda: [500, 502, 503, 504])
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


@dataclass
class StockData:
    """股票数据类 / Stock data class"""

    code: str
    data: pd.DataFrame
    source: DataSource
    frequency: Frequency
    timestamp: datetime.datetime = field(default_factory=datetime.datetime.now)


class StockDataError(Exception):
    """股票数据异常类 / Stock data exception class"""

    pass


class StockDataFetcher:
    """
    股票数据获取器 / Stock data fetcher
    支持同步和异步获取股票数据 / Supports sync and async stock data fetching
    """

    def __init__(self, config: Optional[ApiConfig] = None):
        self.config = config or ApiConfig()
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """创建带重试机制的会话 / Create session with retry mechanism"""
        session = requests.Session()
        retry_strategy = Retry(
            total=self.config.retries,
            backoff_factor=self.config.backoff_factor,
            status_forcelist=self.config.status_forcelist,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        session.headers.update({"User-Agent": self.config.user_agent})
        return session

    @staticmethod
    def _normalize_code(code: str) -> str:
        """标准化股票代码 / Normalize stock code"""
        if not code:
            raise StockDataError("Stock code cannot be empty")

        # 移除空格和转换大小写 / Remove spaces and convert case
        code = code.strip().upper()

        # 处理不同格式的代码 / Handle different code formats
        if code.endswith(".XSHG"):
            return f"sh{code.replace('.XSHG', '')}"
        elif code.endswith(".XSHE"):
            return f"sz{code.replace('.XSHE', '')}"

        return code

    @staticmethod
    def _normalize_date(
        date_input: Union[str, datetime.date, datetime.datetime, None],
    ) -> Optional[str]:
        """标准化日期格式 / Normalize date format"""
        if not date_input:
            return None

        if isinstance(date_input, datetime.date):
            return date_input.strftime("%Y-%m-%d")
        elif isinstance(date_input, str):
            return date_input.split(" ")[0]
        else:
            return str(date_input)

    def _validate_params(self, code: str, count: int, frequency: str) -> None:
        """验证参数 / Validate parameters"""
        if not code:
            raise StockDataError("Stock code is required")
        if count <= 0:
            raise StockDataError("Count must be positive")
        if frequency not in [f.value for f in Frequency]:
            raise StockDataError(f"Invalid frequency: {frequency}")

    def _get_tencent_daily_data(
        self,
        code: str,
        end_date: Optional[str] = None,
        count: int = 10,
        frequency: str = "1d",
    ) -> pd.DataFrame:
        """获取腾讯日线数据 / Get Tencent daily data"""
        # 映射频率到腾讯格式 / Map frequency to Tencent format
        unit_map = {"1d": "day", "1w": "week", "1M": "month"}
        unit = unit_map.get(frequency, "day")

        # 处理今天日期 / Handle today's date
        if end_date and end_date == datetime.datetime.now().strftime("%Y-%m-%d"):
            end_date = ""

        url = "http://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
        params = {"param": f"{code},{unit},,{end_date or ''},{count},qfq"}

        try:
            response = self.session.get(url, params=params, timeout=self.config.timeout)
            response.raise_for_status()
            data = response.json()

            if "data" not in data or code not in data["data"]:
                raise StockDataError(f"No data found for code: {code}")

            stk_data = data["data"][code]
            ms = f"qfq{unit}"
            buf = stk_data.get(ms, stk_data.get(unit, []))

            if not buf:
                raise StockDataError(f"No data available for {code}")

            # 只取前6列数据 / Take only first 6 columns
            buf = [item[:6] for item in buf if len(item) >= 6]

            df = pd.DataFrame(
                buf,
                columns=["time", "open", "close", "high", "low", "volume"],
                dtype="float",
            )
            df.time = pd.to_datetime(df.time)
            df.set_index("time", inplace=True)
            df.index.name = ""

            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Tencent daily data: {e}")
            raise StockDataError(f"Failed to fetch data from Tencent: {e}")

    def _get_tencent_minute_data(
        self,
        code: str,
        end_date: Optional[str] = None,
        count: int = 10,
        frequency: str = "1m",
    ) -> pd.DataFrame:
        """获取腾讯分钟数据 / Get Tencent minute data"""
        ts = int(frequency[:-1]) if frequency[:-1].isdigit() else 1

        url = "http://ifzq.gtimg.cn/appstock/app/kline/mkline"
        params = {"param": f"{code},m{ts},,{count}"}

        try:
            response = self.session.get(url, params=params, timeout=self.config.timeout)
            response.raise_for_status()
            data = response.json()

            if "data" not in data or code not in data["data"]:
                raise StockDataError(f"No data found for code: {code}")

            buf = data["data"][code].get(f"m{ts}", [])
            if not buf:
                raise StockDataError(f"No minute data available for {code}")

            df = pd.DataFrame(
                buf,
                columns=["time", "open", "close", "high", "low", "volume", "n1", "n2"],
            )
            df = df[["time", "open", "close", "high", "low", "volume"]]
            df[["open", "close", "high", "low", "volume"]] = df[
                ["open", "close", "high", "low", "volume"]
            ].astype("float")

            df.time = pd.to_datetime(df.time)
            df.set_index("time", inplace=True)
            df.index.name = ""

            # 更新最新价格 / Update latest price
            if "qt" in data["data"][code] and code in data["data"][code]["qt"]:
                latest_price = data["data"][code]["qt"][code][3]
                df.iloc[-1, df.columns.get_loc("close")] = float(latest_price)

            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Tencent minute data: {e}")
            raise StockDataError(f"Failed to fetch data from Tencent: {e}")

    def _get_sina_data(
        self,
        code: str,
        end_date: Optional[str] = None,
        count: int = 10,
        frequency: str = "60m",
    ) -> pd.DataFrame:
        """获取新浪数据 / Get Sina data"""
        # 频率转换 / Frequency conversion
        freq_map = {"1d": "240m", "1w": "1200m", "1M": "7200m"}
        sina_freq = freq_map.get(frequency, frequency)

        ts = int(sina_freq[:-1]) if sina_freq[:-1].isdigit() else 1
        mcount = count

        # 处理历史数据的日期计算 / Handle date calculation for historical data
        if end_date and sina_freq in ["240m", "1200m", "7200m"]:
            end_date_obj = pd.to_datetime(end_date)
            unit_map = {"1200m": 4, "7200m": 29}
            unit = unit_map.get(sina_freq, 1)
            days_diff = (datetime.datetime.now() - end_date_obj).days
            count = count + days_diff // unit

        url = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData"
        params = {"symbol": code, "scale": ts, "ma": 5, "datalen": count}

        try:
            response = self.session.get(url, params=params, timeout=self.config.timeout)
            response.raise_for_status()
            data = response.json()

            if not data:
                raise StockDataError(f"No data returned from Sina for {code}")

            df = pd.DataFrame(
                data, columns=["day", "open", "high", "low", "close", "volume"]
            )

            # 数据类型转换 / Data type conversion
            numeric_columns = ["open", "high", "low", "close", "volume"]
            for col in numeric_columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

            df.day = pd.to_datetime(df.day)
            df.set_index("day", inplace=True)
            df.index.name = ""

            # 处理历史数据截取 / Handle historical data slicing
            if end_date and sina_freq in ["240m", "1200m", "7200m"]:
                df = df[df.index <= end_date][-mcount:]

            return df

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching Sina data: {e}")
            raise StockDataError(f"Failed to fetch data from Sina: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding Sina response: {e}")
            raise StockDataError(f"Invalid response from Sina: {e}")

    def get_stock_data(
        self,
        code: str,
        end_date: Union[str, datetime.date, None] = None,
        count: int = 10,
        frequency: str = "1d",
        preferred_source: Optional[DataSource] = None,
    ) -> StockData:
        """
        获取股票数据 / Get stock data

        Args:
            code: 股票代码 / Stock code
            end_date: 结束日期 / End date
            count: 数据条数 / Number of data points
            frequency: 数据频率 / Data frequency
            preferred_source: 首选数据源 / Preferred data source

        Returns:
            StockData: 股票数据对象 / Stock data object
        """
        self._validate_params(code, count, frequency)

        normalized_code = self._normalize_code(code)
        normalized_date = self._normalize_date(end_date)
        freq_enum = Frequency(frequency)

        logger.info(f"Fetching data for {normalized_code}, frequency: {frequency}")

        # 根据频率和首选源选择获取方法 / Choose fetch method based on frequency and preferred source
        if freq_enum in [Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY]:
            if preferred_source == DataSource.TENCENT:
                sources = [DataSource.TENCENT, DataSource.SINA]
            else:
                sources = [DataSource.SINA, DataSource.TENCENT]
        else:
            if freq_enum == Frequency.MIN_1:
                sources = [
                    DataSource.TENCENT
                ]  # 1分钟数据只有腾讯有 / Only Tencent has 1-minute data
            else:
                sources = [DataSource.SINA, DataSource.TENCENT]

        last_error = None
        for source in sources:
            try:
                if source == DataSource.SINA:
                    df = self._get_sina_data(
                        normalized_code, normalized_date, count, frequency
                    )
                else:
                    if freq_enum in [
                        Frequency.DAILY,
                        Frequency.WEEKLY,
                        Frequency.MONTHLY,
                    ]:
                        df = self._get_tencent_daily_data(
                            normalized_code, normalized_date, count, frequency
                        )
                    else:
                        df = self._get_tencent_minute_data(
                            normalized_code, normalized_date, count, frequency
                        )

                logger.info(f"Successfully fetched data from {source.value}")
                return StockData(
                    code=normalized_code, data=df, source=source, frequency=freq_enum
                )

            except StockDataError as e:
                last_error = e
                logger.warning(f"Failed to fetch from {source.value}: {e}")
                continue

        raise StockDataError(
            f"Failed to fetch data from all sources. Last error: {last_error}"
        )

    async def get_stock_data_async(
        self,
        code: str,
        end_date: Union[str, datetime.date, None] = None,
        count: int = 10,
        frequency: str = "1d",
        preferred_source: Optional[DataSource] = None,
    ) -> StockData:
        """
        异步获取股票数据 / Async get stock data

        Args:
            code: 股票代码 / Stock code
            end_date: 结束日期 / End date
            count: 数据条数 / Number of data points
            frequency: 数据频率 / Data frequency
            preferred_source: 首选数据源 / Preferred data source

        Returns:
            StockData: 股票数据对象 / Stock data object
        """
        self._validate_params(code, count, frequency)

        normalized_code = self._normalize_code(code)
        normalized_date = self._normalize_date(end_date)
        freq_enum = Frequency(frequency)

        logger.info(
            f"Async fetching data for {normalized_code}, frequency: {frequency}"
        )

        # 根据频率和首选源选择获取方法 / Choose fetch method based on frequency and preferred source
        if freq_enum in [Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY]:
            if preferred_source == DataSource.TENCENT:
                sources = [DataSource.TENCENT, DataSource.SINA]
            else:
                sources = [DataSource.SINA, DataSource.TENCENT]
        else:
            if freq_enum == Frequency.MIN_1:
                sources = [DataSource.TENCENT]
            else:
                sources = [DataSource.SINA, DataSource.TENCENT]

        last_error = None
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout),
            headers={"User-Agent": self.config.user_agent},
        ) as session:
            for source in sources:
                try:
                    if source == DataSource.SINA:
                        df = await self._get_sina_data_async(
                            session, normalized_code, normalized_date, count, frequency
                        )
                    else:
                        if freq_enum in [
                            Frequency.DAILY,
                            Frequency.WEEKLY,
                            Frequency.MONTHLY,
                        ]:
                            df = await self._get_tencent_daily_data_async(
                                session,
                                normalized_code,
                                normalized_date,
                                count,
                                frequency,
                            )
                        else:
                            df = await self._get_tencent_minute_data_async(
                                session,
                                normalized_code,
                                normalized_date,
                                count,
                                frequency,
                            )

                    logger.info(f"Successfully fetched data from {source.value}")
                    return StockData(
                        code=normalized_code,
                        data=df,
                        source=source,
                        frequency=freq_enum,
                    )

                except StockDataError as e:
                    last_error = e
                    logger.warning(f"Failed to fetch from {source.value}: {e}")
                    continue

        raise StockDataError(
            f"Failed to fetch data from all sources. Last error: {last_error}"
        )

    async def _get_sina_data_async(
        self,
        session: aiohttp.ClientSession,
        code: str,
        end_date: Optional[str] = None,
        count: int = 10,
        frequency: str = "60m",
    ) -> pd.DataFrame:
        """异步获取新浪数据 / Async get Sina data"""
        freq_map = {"1d": "240m", "1w": "1200m", "1M": "7200m"}
        sina_freq = freq_map.get(frequency, frequency)
        ts = int(sina_freq[:-1]) if sina_freq[:-1].isdigit() else 1
        mcount = count

        if end_date and sina_freq in ["240m", "1200m", "7200m"]:
            end_date_obj = pd.to_datetime(end_date)
            unit_map = {"1200m": 4, "7200m": 29}
            unit = unit_map.get(sina_freq, 1)
            days_diff = (datetime.datetime.now() - end_date_obj).days
            count = count + days_diff // unit

        url = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData"
        params = {"symbol": code, "scale": ts, "ma": 5, "datalen": count}

        async with session.get(url, params=params) as response:
            if response.status != 200:
                raise StockDataError(f"HTTP {response.status} error from Sina")

            data = await response.json()

            if not data:
                raise StockDataError(f"No data returned from Sina for {code}")

            df = pd.DataFrame(
                data, columns=["day", "open", "high", "low", "close", "volume"]
            )

            numeric_columns = ["open", "high", "low", "close", "volume"]
            for col in numeric_columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

            df.day = pd.to_datetime(df.day)
            df.set_index("day", inplace=True)
            df.index.name = ""

            if end_date and sina_freq in ["240m", "1200m", "7200m"]:
                df = df[df.index <= end_date][-mcount:]

            return df

    async def _get_tencent_daily_data_async(
        self,
        session: aiohttp.ClientSession,
        code: str,
        end_date: Optional[str] = None,
        count: int = 10,
        frequency: str = "1d",
    ) -> pd.DataFrame:
        """异步获取腾讯日线数据 / Async get Tencent daily data"""
        unit_map = {"1d": "day", "1w": "week", "1M": "month"}
        unit = unit_map.get(frequency, "day")

        if end_date and end_date == datetime.datetime.now().strftime("%Y-%m-%d"):
            end_date = ""

        url = "http://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
        params = {"param": f"{code},{unit},,{end_date or ''},{count},qfq"}

        async with session.get(url, params=params) as response:
            if response.status != 200:
                raise StockDataError(f"HTTP {response.status} error from Tencent")

            data = await response.json()

            if "data" not in data or code not in data["data"]:
                raise StockDataError(f"No data found for code: {code}")

            stk_data = data["data"][code]
            ms = f"qfq{unit}"
            buf = stk_data.get(ms, stk_data.get(unit, []))

            if not buf:
                raise StockDataError(f"No data available for {code}")

            buf = [item[:6] for item in buf if len(item) >= 6]

            df = pd.DataFrame(
                buf,
                columns=["time", "open", "close", "high", "low", "volume"],
                dtype="float",
            )
            df.time = pd.to_datetime(df.time)
            df.set_index("time", inplace=True)
            df.index.name = ""

            return df

    async def _get_tencent_minute_data_async(
        self,
        session: aiohttp.ClientSession,
        code: str,
        end_date: Optional[str] = None,
        count: int = 10,
        frequency: str = "1m",
    ) -> pd.DataFrame:
        """异步获取腾讯分钟数据 / Async get Tencent minute data"""
        ts = int(frequency[:-1]) if frequency[:-1].isdigit() else 1

        url = "http://ifzq.gtimg.cn/appstock/app/kline/mkline"
        params = {"param": f"{code},m{ts},,{count}"}

        async with session.get(url, params=params) as response:
            if response.status != 200:
                raise StockDataError(f"HTTP {response.status} error from Tencent")

            data = await response.json()

            if "data" not in data or code not in data["data"]:
                raise StockDataError(f"No data found for code: {code}")

            buf = data["data"][code].get(f"m{ts}", [])
            if not buf:
                raise StockDataError(f"No minute data available for {code}")

            df = pd.DataFrame(
                buf,
                columns=["time", "open", "close", "high", "low", "volume", "n1", "n2"],
            )
            df = df[["time", "open", "close", "high", "low", "volume"]]
            df[["open", "close", "high", "low", "volume"]] = df[
                ["open", "close", "high", "low", "volume"]
            ].astype("float")

            df.time = pd.to_datetime(df.time)
            df.set_index("time", inplace=True)
            df.index.name = ""

            if "qt" in data["data"][code] and code in data["data"][code]["qt"]:
                latest_price = data["data"][code]["qt"][code][3]
                df.iloc[-1, df.columns.get_loc("close")] = float(latest_price)

            return df

    async def get_multiple_stocks_async(
        self, codes: List[str], **kwargs
    ) -> List[StockData]:
        """
        异步获取多个股票数据 / Async get multiple stocks data

        Args:
            codes: 股票代码列表 / List of stock codes
            **kwargs: 其他参数 / Other parameters

        Returns:
            List[StockData]: 股票数据列表 / List of stock data
        """
        tasks = [self.get_stock_data_async(code, **kwargs) for code in codes]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        stock_data_list = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching data for {codes[i]}: {result}")
            else:
                stock_data_list.append(result)

        return stock_data_list

    def close(self):
        """关闭会话 / Close session"""
        if hasattr(self, "session"):
            self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# 向后兼容的函数 / Backward compatible functions
def get_price(
    code: str,
    end_date: Union[str, datetime.date, None] = None,
    count: int = 10,
    frequency: str = "1d",
    fields: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    获取股票价格数据 - 向后兼容 / Get stock price data - backward compatible

    Args:
        code: 股票代码 / Stock code
        end_date: 结束日期 / End date
        count: 数据条数 / Number of data points
        frequency: 数据频率 / Data frequency
        fields: 字段列表 (暂未使用) / Fields list (not used yet)

    Returns:
        pd.DataFrame: 股票数据 / Stock data
    """
    with StockDataFetcher() as fetcher:
        stock_data = fetcher.get_stock_data(code, end_date, count, frequency)
        return stock_data.data


async def get_price_async(
    code: str,
    end_date: Union[str, datetime.date, None] = None,
    count: int = 10,
    frequency: str = "1d",
    fields: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    异步获取股票价格数据 / Async get stock price data

    Args:
        code: 股票代码 / Stock code
        end_date: 结束日期 / End date
        count: 数据条数 / Number of data points
        frequency: 数据频率 / Data frequency
        fields: 字段列表 (暂未使用) / Fields list (not used yet)

    Returns:
        pd.DataFrame: 股票数据 / Stock data
    """
    fetcher = StockDataFetcher()
    try:
        stock_data = await fetcher.get_stock_data_async(
            code, end_date, count, frequency
        )
        return stock_data.data
    finally:
        fetcher.close()


if __name__ == "__main__":
    # 同步示例 / Sync example
    print("=== 同步示例 / Sync Example ===")

    # 获取上证指数日线数据 / Get Shanghai Composite daily data
    df = get_price("sh000001", frequency="1d", count=5)
    print("上证指数日线行情 / Shanghai Composite Daily:")
    print(df)
    print()

    # 获取贵州茅台分钟数据 / Get Kweichow Moutai minute data
    df = get_price("sh600519", frequency="15m", count=5)
    print("贵州茅台15分钟线 / Kweichow Moutai 15min:")
    print(df)
    print()

    # 使用StockDataFetcher类 / Using StockDataFetcher class
    print("=== 使用StockDataFetcher类 / Using StockDataFetcher Class ===")
    with StockDataFetcher() as fetcher:
        stock_data = fetcher.get_stock_data("000001.XSHG", frequency="1d", count=5)
        print(f"数据源: {stock_data.source.value}")
        print(f"频率: {stock_data.frequency.value}")
        print(f"时间戳: {stock_data.timestamp}")
        print(stock_data.data)
        print()

    # 异步示例 / Async example
    async def async_example():
        print("=== 异步示例 / Async Example ===")

        # 单个股票异步获取 / Single stock async fetch
        df = await get_price_async("sh000001", frequency="1d", count=5)
        print("异步获取上证指数 / Async Shanghai Composite:")
        print(df)
        print()

        # 多个股票同时获取 / Multiple stocks fetch simultaneously
        fetcher = StockDataFetcher()
        try:
            codes = ["sh000001", "sz399001", "sh600519"]
            stock_data_list = await fetcher.get_multiple_stocks_async(
                codes, frequency="1d", count=3
            )

            print("多个股票同时获取 / Multiple stocks fetch:")
            for stock_data in stock_data_list:
                print(f"{stock_data.code} - {stock_data.source.value}:")
                print(stock_data.data.tail(2))
                print()
        finally:
            fetcher.close()

    # 运行异步示例 / Run async example
    asyncio.run(async_example())
