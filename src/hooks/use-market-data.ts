/**
 * 市场数据 TanStack Query hooks
 *
 * 封装所有行情数据获取逻辑，提供：
 * - 自动缓存与过期策略
 * - 后台静默刷新
 * - 加载/错误状态管理
 * - 数据格式化
 */
import { useQuery } from "@tanstack/react-query";
import type {
  ApiResponse,
  IndexData,
  StockSpot,
  StockDetail,
  KlineItem,
  SectorItem,
  NorthboundItem,
  PaginationMeta,
} from "@/types/market";

const MARKET_PROXY = "/api/market";

// ===== Shared Fetchers =====

async function fetchMarket<T>(path: string): Promise<T> {
  const res = await fetch(`${MARKET_PROXY}${path}`);
  if (!res.ok) {
    throw new Error(`Market API error: ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

async function fetchMarketWithMeta<T>(
  path: string
): Promise<{ data: T; meta: PaginationMeta }> {
  const res = await fetch(`${MARKET_PROXY}${path}`);
  if (!res.ok) {
    throw new Error(`Market API error: ${res.status}`);
  }
  const json = await res.json();
  return { data: json.data, meta: json.meta };
}

// ===== Hooks =====

/** 三大指数 + 沪深300 实时行情 */
export function useIndices() {
  return useQuery({
    queryKey: ["market", "indices"],
    queryFn: () => fetchMarket<IndexData[]>("/indices"),
    refetchInterval: 30_000, // 30s auto-refresh
    staleTime: 10_000,
  });
}

/** 全市场 A 股行情（分页+排序） */
export function useSpot(page = 1, size = 50, sort = "change_percent", order = "desc") {
  return useQuery({
    queryKey: ["market", "spot", page, size, sort, order],
    queryFn: () =>
      fetchMarketWithMeta<StockSpot[]>(
        `/spot?page=${page}&size=${size}&sort=${sort}&order=${order}`
      ),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

/** 个股详情（行情 + 基本信息） */
export function useStockDetail(code: string) {
  return useQuery({
    queryKey: ["market", "stock", code],
    queryFn: () => fetchMarket<StockDetail>(`/stock/${code}`),
    refetchInterval: 15_000,
    staleTime: 5_000,
    enabled: !!code,
  });
}

/** 历史 K 线数据 */
export function useKline(
  code: string,
  period = "daily",
  start?: string,
  end?: string,
  limit = 250
) {
  return useQuery({
    queryKey: ["market", "kline", code, period, start, end, limit],
    queryFn: () => {
      const params = new URLSearchParams({
        period,
        limit: String(limit),
      });
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      return fetchMarket<KlineItem[]>(`/kline/${code}?${params}`);
    },
    staleTime: 60_000,
    enabled: !!code,
  });
}

/** 分时数据 */
export function useMinuteData(code: string, freq = "5m", count = 240) {
  return useQuery({
    queryKey: ["market", "minute", code, freq, count],
    queryFn: () => fetchMarket<KlineItem[]>(`/minute/${code}?freq=${freq}&count=${count}`),
    refetchInterval: 10_000,
    staleTime: 5_000,
    enabled: !!code,
  });
}

/** 行业板块行情 */
export function useSectors() {
  return useQuery({
    queryKey: ["market", "sectors"],
    queryFn: () => fetchMarket<SectorItem[]>("/sectors"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

/** 北向资金流向 */
export function useNorthbound(days = 30) {
  return useQuery({
    queryKey: ["market", "northbound", days],
    queryFn: () => fetchMarket<NorthboundItem[]>(`/northbound?days=${days}`),
    staleTime: 300_000,
  });
}

/** 基本面数据 */
export function useFundamentals(code: string) {
  return useQuery({
    queryKey: ["market", "fundamentals", code],
    queryFn: () => fetchMarket<Record<string, unknown>[]>(`/fundamentals/${code}`),
    staleTime: 600_000,
    enabled: !!code,
  });
}
