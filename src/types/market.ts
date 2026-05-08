// A 股行情数据类型定义

export interface IndexData {
  code: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

export interface StockSpot {
  code: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  pre_close: number;
  change: number;
  change_percent: number;
  volume: number;
  turnover: number;
  turnover_rate?: number;
  volume_ratio?: number;
  pe?: number | null;
  pb?: number | null;
  total_market_value?: number;
  circulating_market_value?: number;
  change_60d?: number;
}

export interface KlineItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  turnover?: number;
  amplitude?: number;
  change?: number;
  change_percent?: number;
  turnover_rate?: number;
}

export interface StockDetail {
  code: string;
  spot: StockSpot | null;
  info: Record<string, unknown> | null;
}

export interface SectorItem {
  name: string;
  price: number;
  change_percent: number;
  total_market_value?: number | null;
  turnover_rate?: number | null;
  up_count?: number;
  down_count?: number;
  lead_stock?: string;
  lead_change?: number;
}

export interface NorthboundItem {
  date: string;
  net_flow: number | null;
  balance?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  source?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  pages?: number;
}
