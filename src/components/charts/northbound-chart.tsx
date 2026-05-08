"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  HistogramSeries,
  LineSeries,
  ColorType,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import type { NorthboundItem } from "@/types/market";

interface NorthboundChartProps {
  data: NorthboundItem[];
  isLoading?: boolean;
}

const CHART_COLORS = {
  background: "#0a0a0b",
  grid: "rgba(255,255,255,0.04)",
  text: "rgba(255,255,255,0.4)",
  crosshair: "rgba(255,255,255,0.12)",
  up: "rgba(0, 200, 83, 0.7)",
  down: "rgba(255, 82, 82, 0.7)",
};

export function NorthboundChart({ data, isLoading }: NorthboundChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const allSeriesRefs = useRef<ReturnType<IChartApi["addSeries"]>[]>([]);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
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
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      width: containerRef.current.clientWidth,
      height: 300,
    });

    // Histogram for daily net flow
    const histSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
    });

    // Cumulative line
    const lineSeries = chart.addSeries(LineSeries, {
      color: "rgba(100, 180, 255, 0.5)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    allSeriesRefs.current = [histSeries, lineSeries];
  }, []);

  useEffect(() => {
    if (!data.length) return;

    if (!chartRef.current) {
      initChart();
    }
    if (!chartRef.current || !allSeriesRefs.current.length) return;

    const chart = chartRef.current;

    // Build histogram data (net flow per day, convert to 亿)
    const histData = data.map((item) => {
      const flow = (item.net_flow ?? 0) / 1e8; // to 亿
      return {
        time: (item.date?.length === 10
          ? item.date.slice(0, 10)
          : item.date?.length === 8
          ? `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`
          : item.date ?? "") as Time,
        value: flow,
        color: flow >= 0 ? CHART_COLORS.up : CHART_COLORS.down,
      };
    });

    // Build cumulative line data
    let cumulative = 0;
    const lineData = data.map((item) => {
      cumulative += (item.net_flow ?? 0) / 1e8;
      return {
        time: (item.date?.length === 10
          ? item.date.slice(0, 10)
          : item.date?.length === 8
          ? `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`
          : item.date ?? "") as Time,
        value: cumulative,
      };
    });

    allSeriesRefs.current[0]?.setData(histData);
    allSeriesRefs.current[1]?.setData(lineData);

    chart.timeScale().fitContent();
  }, [data, initChart]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        暂无北向资金数据
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-2 pb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded" style={{ background: CHART_COLORS.up }} />
          单日净流入
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 border-t"
            style={{ borderColor: "rgba(100, 180, 255, 0.5)" }}
          />
          累计净流入
        </span>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
