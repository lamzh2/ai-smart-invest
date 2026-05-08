"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type Time,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import type { KlineItem } from "@/types/market";

interface KlineChartProps {
  data: KlineItem[];
  period: "daily" | "weekly" | "monthly";
  isLoading?: boolean;
}

function toCandleData(items: KlineItem[]): CandlestickData[] {
  return items.map((item) => ({
    time: (item.date.length === 8
      ? `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`
      : item.date.slice(0, 10)) as Time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
  }));
}

function toVolumeData(items: KlineItem[]): HistogramData[] {
  return items.map((item) => ({
    time: (item.date.length === 8
      ? `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`
      : item.date.slice(0, 10)) as Time,
    value: item.volume,
    color: item.close >= item.open
      ? "rgba(0, 200, 83, 0.4)"
      : "rgba(255, 82, 82, 0.4)",
  }));
}

function computeMA(data: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

// Chart colors — financial dark theme
const CHART_COLORS = {
  background: "#0a0a0b",
  grid: "rgba(255,255,255,0.04)",
  text: "rgba(255,255,255,0.4)",
  crosshair: "rgba(255,255,255,0.12)",
  up: "rgba(0, 200, 83, 0.8)",
  down: "rgba(255, 82, 82, 0.8)",
  upBorder: "#00c853",
  downBorder: "#ff5252",
  upWick: "#00c853",
  downWick: "#ff5252",
};

const MA_COLORS = [
  "rgba(255, 215, 0, 0.8)",    // MA5 - gold
  "rgba(255, 152, 0, 0.7)",    // MA10 - orange
  "rgba(0, 188, 212, 0.7)",    // MA20 - cyan
  "rgba(156, 39, 176, 0.7)",   // MA60 - purple
];

const MA_PERIODS = [5, 10, 20, 60];
const MA_LABELS = ["MA5", "MA10", "MA20", "MA60"];

export function KlineChart({ data, period, isLoading }: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ReturnType<IChartApi["addSeries"]>[]>([]);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Cleanup previous
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: 2,
        },
        horzLine: {
          color: CHART_COLORS.crosshair,
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      width: containerRef.current.clientWidth,
      height: 500,
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.up,
      downColor: CHART_COLORS.down,
      borderUpColor: CHART_COLORS.upBorder,
      borderDownColor: CHART_COLORS.downBorder,
      wickUpColor: CHART_COLORS.upWick,
      wickDownColor: CHART_COLORS.downWick,
    });

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRefs.current = [candleSeries, volumeSeries];
  }, []);

  // Set data
  useEffect(() => {
    if (!data.length) return;

    // Ensure chart is initialized
    if (!chartRef.current) {
      initChart();
    }
    if (!chartRef.current || !seriesRefs.current.length) return;

    const chart = chartRef.current;
    const candleData = toCandleData(data);
    const volumeData = toVolumeData(data);

    // Update candlestick (index 0)
    if (seriesRefs.current[0]) {
      seriesRefs.current[0].setData(candleData as Parameters<typeof seriesRefs.current[0]["setData"]>[0]);
    }

    // Update volume (index 1)
    if (seriesRefs.current[1]) {
      seriesRefs.current[1].setData(volumeData as Parameters<typeof seriesRefs.current[1]["setData"]>[0]);
    }

    // Remove old MA series (index 2+)
    for (let i = seriesRefs.current.length - 1; i >= 2; i--) {
      chart.removeSeries(seriesRefs.current[i]);
      seriesRefs.current.pop();
    }

    // Add MAs
    MA_PERIODS.forEach((p, i) => {
      const maData = computeMA(candleData, p);
      const maSeries = chart.addSeries(LineSeries, {
        color: MA_COLORS[i],
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      maSeries.setData(maData);
      seriesRefs.current.push(maSeries);
    });

    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, initChart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[500px] text-muted-foreground text-sm">
        暂无K线数据
      </div>
    );
  }

  return (
    <div>
      {/* MA Legend */}
      <div className="flex gap-3 px-2 pb-2">
        {MA_LABELS.map((label, i) => (
          <span key={label} className="text-xs text-muted-foreground flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: MA_COLORS[i] }}
            />
            {label}
          </span>
        ))}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
