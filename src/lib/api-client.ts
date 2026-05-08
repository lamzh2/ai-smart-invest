import type {
  ApiResponse as ApiResponseType,
  IndexData,
  StockSpot,
  StockDetail,
  KlineItem,
  SectorItem,
  NorthboundItem,
} from "@/types/market";

export type { ApiResponseType as ApiResponse };

const API_BASE = "/api/market";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: `HTTP ${res.status}`,
    }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

// ===== Market API =====

export const marketApi = {
  getIndices: () => fetchApi<IndexData[]>("/indices"),

  getSpot: (page = 1, size = 50, sort = "change_percent", order = "desc") =>
    fetchApi<StockSpot[]>(
      `/spot?page=${page}&size=${size}&sort=${sort}&order=${order}`
    ),

  getStock: (code: string) => fetchApi<StockDetail>(`/stock/${code}`),

  getKline: (
    code: string,
    period = "daily",
    start?: string,
    end?: string,
    limit = 250
  ) => {
    const params = new URLSearchParams({ period, limit: String(limit) });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return fetchApi<KlineItem[]>(`/kline/${code}?${params}`);
  },

  getMinute: (code: string, freq = "5m", count = 240) =>
    fetchApi<KlineItem[]>(`/minute/${code}?freq=${freq}&count=${count}`),

  getSectors: () => fetchApi<SectorItem[]>("/sectors"),

  getNorthbound: (days = 30) =>
    fetchApi<NorthboundItem[]>(`/northbound?days=${days}`),

  getFundamentals: (code: string) =>
    fetchApi<Record<string, unknown>[]>(`/fundamentals/${code}`),
};

// ===== AI API (to be proxied later) =====

export const aiApi = {
  committee: (stockCode: string, stockName: string) =>
    fetchApi<unknown>("/api/ai/committee", {
      method: "POST",
      body: JSON.stringify({ stockCode, stockName }),
    }),
  chat: (message: string, sessionId?: string) =>
    fetchApi<unknown>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, sessionId }),
    }),
  deepResearch: (topic: string) =>
    fetchApi<unknown>("/api/ai/deep-research", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
  screener: (filters: Record<string, unknown>) =>
    fetchApi<unknown>("/api/ai/screener", {
      method: "POST",
      body: JSON.stringify({ filters }),
    }),
  getLeaderboard: () => fetchApi<unknown>("/api/ai/leaderboard"),
};

// ===== User API =====

export const userApi = {
  getProfile: () => fetchApi<unknown>("/api/user/profile"),
  updateProfile: (data: Record<string, unknown>) =>
    fetchApi<unknown>("/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getWatchlist: () => fetchApi<unknown>("/api/user/watchlist"),
  addToWatchlist: (code: string, name: string) =>
    fetchApi<unknown>("/api/user/watchlist", {
      method: "POST",
      body: JSON.stringify({ code, name }),
    }),
  removeFromWatchlist: (code: string) =>
    fetchApi<unknown>(`/api/user/watchlist?code=${code}`, { method: "DELETE" }),
  getHistory: (page = 1) => fetchApi<unknown>(`/api/user/history?page=${page}`),
};

export { fetchApi, API_BASE };
