/**
 * A 股行情数据服务 — 直接调用东方财富 / 新浪公开 API
 * 无需 Python 后端，纯 TypeScript 实现
 */

// ============================================================
// 类型定义
// ============================================================
export interface MarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockSpot {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  preClose: number;
  turnover: number;
  pe: number | null;
  marketCap: number | null;
}

export interface KlineItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  changePercent: number;
  turnover: number;
}

export interface SectorItem {
  code: string;
  name: string;
  changePercent: number;
  change: number;
  price: number;
  volume: number;
  amount: number;
  leadStock: string;
}

export interface FundFlowItem {
  date: string;
  northbound: number;  // 北向净流入 (亿)
  cumulative: number;  // 累计净买入 (亿)
}

// ============================================================
// 东方财富 API 调用
// ============================================================

const EASTMONEY_HOST = "push2.eastmoney.com";
const EASTMONEY_HIS_HOST = "push2his.eastmoney.com";

async function emFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://${EASTMONEY_HOST}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://quote.eastmoney.com/",
    },
    next: { revalidate: 10 }, // ISR: 10s cache
  });

  if (!res.ok) throw new Error(`EastMoney API error: ${res.status}`);
  const json = await res.json();
  return json as T;
}

// ============================================================
// 四大指数实时行情
// ============================================================
export async function getIndices(): Promise<MarketIndex[]> {
  // 上证: 1.000001, 深证: 0.399001, 创业板: 0.399006, 科创50: 1.000688
  const codes = ["1.000001", "0.399001", "0.399006", "1.000688"];
  const names = ["上证指数", "深证成指", "创业板指", "科创50"];

  try {
    // 用东方财富指数接口
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${codes.join(",")}`,
      { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 5 } }
    );

    if (!res.ok) return mockIndices();
    const data = await res.json();

    if (!data?.data?.diff) return mockIndices();

    return (data.data.diff as any[]).map((item: any, i: number) => ({
      code: item.f12 || codes[i],
      name: item.f14 || names[i],
      price: item.f2 ?? 0,
      change: item.f4 ?? 0,
      changePercent: item.f3 ?? 0,
    }));
  } catch {
    return mockIndices();
  }
}

function mockIndices(): MarketIndex[] {
  return [
    { code: "000001", name: "上证指数", price: 3379.95, change: 0.88, changePercent: 0.03 },
    { code: "399001", name: "深证成指", price: 10856.30, change: -12.45, changePercent: -0.11 },
    { code: "399006", name: "创业板指", price: 2254.12, change: 5.34, changePercent: 0.24 },
    { code: "000688", name: "科创50", price: 1012.58, change: 8.21, changePercent: 0.82 },
  ];
}

// ============================================================
// 全市场实时行情（分页+排序）
// ============================================================
export async function getSpotList(
  page = 1,
  size = 50,
  sort = "f3",
  order = "desc"
): Promise<{ total: number; items: StockSpot[] }> {
  try {
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/clist/get?` +
      `pn=${page}&pz=${size}&po=${order === "desc" ? 0 : 1}&np=1&fltt=2&invt=2` +
      `&fid=${sort}&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23` +
      `&fields=f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f14,f15,f16,f17,f18,f20,f21,f115`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 10 },
      }
    );

    if (!res.ok) return { total: 0, items: [] };
    const data = await res.json();

    const list = data?.data?.diff ?? [];
    const total = data?.data?.total ?? list.length;

    const items: StockSpot[] = (list as any[]).map((item: any) => ({
      code: item.f12 ?? "",
      name: item.f14 ?? "",
      price: item.f2 ?? 0,
      change: item.f4 ?? 0,
      changePercent: item.f3 ?? 0,
      volume: item.f5 ?? 0,
      amount: item.f6 ?? 0,
      high: item.f15 ?? 0,
      low: item.f16 ?? 0,
      open: item.f17 ?? 0,
      preClose: item.f18 ?? 0,
      turnover: item.f8 ?? 0,
      pe: item.f9 ?? null,
      marketCap: item.f20 ?? null,
    }));

    return { total, items };
  } catch {
    return { total: 0, items: [] };
  }
}

// ============================================================
// 个股行情
// ============================================================
export async function getStockDetail(code: string): Promise<StockSpot | null> {
  try {
    const marketCode = code.startsWith("6") ? `1.${code}` : `0.${code}`;
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/stock/get?secid=${marketCode}&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f55,f57,f58,f60,f116,f117,f162,f167,f168,f169,f170,f171`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 5 },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.data;
    if (!item) return null;

    return {
      code,
      name: item.f58 ?? code,
      price: item.f43 ?? 0,
      change: item.f169 ?? 0,
      changePercent: item.f170 ?? 0,
      volume: item.f47 ?? 0,
      amount: item.f48 ?? 0,
      high: item.f44 ?? 0,
      low: item.f45 ?? 0,
      open: item.f46 ?? 0,
      preClose: item.f60 ?? 0,
      turnover: item.f168 ?? 0,
      pe: item.f162 ?? null,
      marketCap: item.f116 ?? null,
    };
  } catch {
    return null;
  }
}

// ============================================================
// 历史 K 线
// ============================================================
export async function getKline(
  code: string,
  period = "daily",
  limit = 250
): Promise<KlineItem[]> {
  try {
    const marketCode = code.startsWith("6") ? `1.${code}` : `0.${code}`;
    const kltMap: Record<string, string> = {
      daily: "101", weekly: "102", monthly: "103",
      "60": "60", "30": "30", "15": "15", "5": "5",
    };

    const res = await fetch(
      `https://push2his.eastmoney.com/api/qt/stock/kline/get?` +
      `secid=${marketCode}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61` +
      `&klt=${kltMap[period] ?? "101"}&fqt=1&end=20500101&lmt=${limit}`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const rawList = data?.data?.klines ?? [];

    return (rawList as string[]).map((line: string) => {
      const parts = line.split(",");
      return {
        date: parts[0] ?? "",
        open: parseFloat(parts[1]) || 0,
        close: parseFloat(parts[2]) || 0,
        high: parseFloat(parts[3]) || 0,
        low: parseFloat(parts[4]) || 0,
        volume: parseFloat(parts[5]) || 0,
        amount: parseFloat(parts[6]) || 0,
        changePercent: parseFloat(parts[8]) || 0,
        turnover: parseFloat(parts[10]) || 0,
      };
    });
  } catch {
    return [];
  }
}

// ============================================================
// 行业板块
// ============================================================
export async function getSectors(): Promise<SectorItem[]> {
  try {
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/clist/get?` +
      `pn=1&pz=100&po=0&np=1&fltt=2&invt=2` +
      `&fid=f3&fs=m:90+t:2` +
      `&fields=f2,f3,f4,f5,f6,f12,f14,f128`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data?.diff ?? [];

    return (list as any[]).map((item: any) => ({
      code: item.f12 ?? "",
      name: item.f14 ?? "",
      changePercent: item.f3 ?? 0,
      change: item.f4 ?? 0,
      price: item.f2 ?? 0,
      volume: item.f5 ?? 0,
      amount: item.f6 ?? 0,
      leadStock: item.f128 ?? "",
    }));
  } catch {
    return [];
  }
}

// ============================================================
// 北向资金
// ============================================================
export async function getNorthbound(days = 30): Promise<FundFlowItem[]> {
  try {
    const res = await fetch(
      `https://push2his.eastmoney.com/api/qt/kamt.kline/get?` +
      `fields1=f1,f2,f3,f4&fields2=f51,f52,f53&klt=101&lmt=${days}`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://data.eastmoney.com/" },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const rawList = data?.data?.klines ?? [];

    let cumulative = 0;
    return (rawList as string[]).map((line: string) => {
      const parts = line.split(",");
      const flow = parseFloat(parts[1]) || 0;
      cumulative += flow;
      return {
        date: parts[0] ?? "",
        northbound: Math.round(flow / 10000 * 100) / 100, // 转换为亿
        cumulative: Math.round(cumulative / 10000 * 100) / 100,
      };
    });
  } catch {
    return [];
  }
}

// ============================================================
// 分时数据（模拟，东方财富分时需要特殊处理）
// ============================================================
export async function getMinuteData(
  code: string,
  freq: string = "1"
): Promise<{ time: string; price: number; volume: number; avg: number }[]> {
  try {
    const marketCode = code.startsWith("6") ? `1.${code}` : `0.${code}`;
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/stock/trends2/get?` +
      `secid=${marketCode}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58` +
      `&iscr=0&ndays=1`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const trends = data?.data?.trends ?? [];

    return (trends as string[]).map((line: string) => {
      const parts = line.split(",");
      return {
        time: parts[0] ?? "",
        price: parseFloat(parts[2]) || 0,
        volume: parseFloat(parts[5]) || 0,
        avg: parseFloat(parts[7]) || 0,
      };
    });
  } catch {
    return [];
  }
}

// ============================================================
// 股票搜索
// ============================================================
export async function searchStocks(
  keyword: string
): Promise<{ code: string; name: string; market: string }[]> {
  try {
    const res = await fetch(
      `https://searchadapter.eastmoney.com/api/suggest/get?` +
      `input=${encodeURIComponent(keyword)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&count=10`,
      {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://quote.eastmoney.com/" },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const stocks = data?.QuotationCodeTable?.Data ?? [];

    return (stocks as any[])
      .filter((s: any) => s.Classify === "UsStock" || s.SecurityType === "ASH")
      .map((s: any) => ({
        code: s.Code ?? "",
        name: s.Name ?? "",
        market: s.Market ?? "SH",
      }));
  } catch {
    return [];
  }
}
