"use client";

import { useMemo } from "react";
import type { KlineItem } from "@/types/market";

interface TechnicalIndicatorsProps {
  data: KlineItem[];
}

interface MACDResult {
  date: string;
  dif: number;
  dea: number;
  macd: number;
}

function calcMACD(data: KlineItem[]): MACDResult[] {
  const closePrices = data.map((d) => d.close);
  const ema12: number[] = [];
  const ema26: number[] = [];
  const dif: number[] = [];
  const dea: number[] = [];
  const macd: number[] = [];
  const results: MACDResult[] = [];

  for (let i = 0; i < closePrices.length; i++) {
    if (i === 0) {
      ema12.push(closePrices[i]);
      ema26.push(closePrices[i]);
    } else {
      ema12.push((closePrices[i] * 2) / (12 + 1) + (ema12[i - 1] * (12 - 1)) / (12 + 1));
      ema26.push((closePrices[i] * 2) / (26 + 1) + (ema26[i - 1] * (26 - 1)) / (26 + 1));
    }
    const difVal = ema12[i] - ema26[i];
    dif.push(difVal);
  }

  for (let i = 0; i < dif.length; i++) {
    if (i === 0) {
      dea.push(dif[i]);
    } else {
      dea.push((dif[i] * 2) / (9 + 1) + (dea[i - 1] * (9 - 1)) / (9 + 1));
    }
    macd.push((dif[i] - dea[i]) * 2);
    results.push({
      date: data[i].date,
      dif: dif[i],
      dea: dea[i],
      macd: macd[i],
    });
  }

  return results;
}

interface KDJResult {
  date: string;
  k: number;
  d: number;
  j: number;
}

function calcKDJ(data: KlineItem[], n = 9): KDJResult[] {
  const results: KDJResult[] = [];
  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      results.push({ date: data[i].date, k: 50, d: 50, j: 50 });
      continue;
    }

    const slice = data.slice(i - n + 1, i + 1);
    const highest = Math.max(...slice.map((d) => d.high));
    const lowest = Math.min(...slice.map((d) => d.low));

    const rsv =
      highest === lowest
        ? 50
        : ((data[i].close - lowest) / (highest - lowest)) * 100;

    const k = (2 / 3) * prevK + (1 / 3) * rsv;
    const d = (2 / 3) * prevD + (1 / 3) * k;
    const j = 3 * k - 2 * d;

    results.push({ date: data[i].date, k, d, j });
    prevK = k;
    prevD = d;
  }

  return results;
}

interface BOLLResult {
  date: string;
  mid: number;
  upper: number;
  lower: number;
}

function calcBOLL(data: KlineItem[], n = 20, multiplier = 2): BOLLResult[] {
  const results: BOLLResult[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      results.push({ date: data[i].date, mid: data[i].close, upper: data[i].close, lower: data[i].close });
      continue;
    }

    const slice = data.slice(i - n + 1, i + 1).map((d) => d.close);
    const sum = slice.reduce((a, b) => a + b, 0);
    const mid = sum / n;
    const variance = slice.reduce((s, v) => s + (v - mid) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);

    results.push({
      date: data[i].date,
      mid,
      upper: mid + multiplier * stddev,
      lower: mid - multiplier * stddev,
    });
  }

  return results;
}

function formatIndicatorDate(dateStr: string): string {
  if (dateStr.length >= 10) return dateStr.slice(5, 10);
  if (dateStr.length === 8) return `${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  return dateStr;
}

export function TechnicalIndicators({ data }: TechnicalIndicatorsProps) {
  const macdData = useMemo(() => calcMACD(data), [data]);
  const kdjData = useMemo(() => calcKDJ(data), [data]);
  const bollData = useMemo(() => calcBOLL(data), [data]);

  // Show last 4 items for summary
  const recent = {
    macd: macdData.slice(-4).reverse(),
    kdj: kdjData.slice(-4).reverse(),
    boll: bollData.slice(-4).reverse(),
  };

  // Latest values
  const latestMACD = macdData[macdData.length - 1];
  const latestKDJ = kdjData[kdjData.length - 1];
  const latestBOLL = bollData[bollData.length - 1];

  const macdSignal =
    latestMACD
      ? latestMACD.dif > latestMACD.dea
        ? "金叉 / 看多"
        : latestMACD.dif < latestMACD.dea
        ? "死叉 / 看空"
        : "粘合"
      : "—";

  const kdjSignal =
    latestKDJ
      ? latestKDJ.j > 80
        ? "超买区"
        : latestKDJ.j < 20
        ? "超卖区"
        : latestKDJ.k > latestKDJ.d
        ? "多头"
        : "空头"
      : "—";

  const bollSignal =
    latestBOLL && data.length > 0
      ? data[data.length - 1].close > latestBOLL.upper
        ? "突破上轨 / 超买"
        : data[data.length - 1].close < latestBOLL.lower
        ? "跌破下轨 / 超卖"
        : "轨道内运行"
      : "—";

  const indicatorPanels = [
    {
      name: "MACD",
      signal: macdSignal,
      signalColor:
        macdSignal.includes("金叉") || macdSignal.includes("看多")
          ? "text-up"
          : macdSignal.includes("死叉") || macdSignal.includes("看空")
          ? "text-down"
          : "text-muted-foreground",
      latest: latestMACD
        ? `DIF ${latestMACD.dif.toFixed(3)} | DEA ${latestMACD.dea.toFixed(3)} | MACD ${latestMACD.macd.toFixed(3)}`
        : "—",
      history: recent.macd.map((d) => ({
        label: formatIndicatorDate(d.date),
        values: `DIF ${d.dif.toFixed(3)} DEA ${d.dea.toFixed(3)} MACD ${d.macd.toFixed(3)}`,
      })),
    },
    {
      name: "KDJ",
      signal: kdjSignal,
      signalColor:
        kdjSignal.includes("超买")
          ? "text-down"
          : kdjSignal.includes("超卖")
          ? "text-up"
          : kdjSignal.includes("多头")
          ? "text-up"
          : "text-down",
      latest: latestKDJ
        ? `K ${latestKDJ.k.toFixed(2)} | D ${latestKDJ.d.toFixed(2)} | J ${latestKDJ.j.toFixed(2)}`
        : "—",
      history: recent.kdj.map((d) => ({
        label: formatIndicatorDate(d.date),
        values: `K ${d.k.toFixed(2)} D ${d.d.toFixed(2)} J ${d.j.toFixed(2)}`,
      })),
    },
    {
      name: "BOLL",
      signal: bollSignal,
      signalColor:
        bollSignal.includes("超买") || bollSignal.includes("突破上轨")
          ? "text-down"
          : bollSignal.includes("超卖") || bollSignal.includes("跌破下轨")
          ? "text-up"
          : "text-muted-foreground",
      latest: latestBOLL
        ? `上轨 ${latestBOLL.upper.toFixed(2)} | 中轨 ${latestBOLL.mid.toFixed(2)} | 下轨 ${latestBOLL.lower.toFixed(2)}`
        : "—",
      history: recent.boll.map((d) => ({
        label: formatIndicatorDate(d.date),
        values: `上 ${d.upper.toFixed(2)} 中 ${d.mid.toFixed(2)} 下 ${d.lower.toFixed(2)}`,
      })),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indicatorPanels.map((panel) => (
        <div
          key={panel.name}
          className="rounded-lg border border-border bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">{panel.name}</h4>
            <span className={`text-xs font-medium ${panel.signalColor}`}>
              {panel.signal}
            </span>
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-3">
            {panel.latest}
          </p>
          <div className="space-y-1">
            {panel.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{h.label}</span>
                <span className="font-mono text-muted-foreground/70">{h.values}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
