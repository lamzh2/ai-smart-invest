"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  LineSeries,
  ColorType,
  type IChartApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import type { KlineItem, StockSpot } from "@/types/market";

interface MinuteChartProps {
  data: KlineItem[];
  spot?: StockSpot;
  isLoading?: boolean;
}

function toLineData(items: KlineItem[]): LineData[] {
  return items.map((item) => ({
    time: (item.date.length === 8
      ? `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`
      : item.date.slice(0, 10)) as Time,
    value: item.close,
  }));
}

const CHART_COLORS = {
  background: "#0a0a0b",
  grid: "rgba(255,255,255,0.04)",
  text: "rgba(255,255,255,0.4)",
  crosshair: "rgba(255,255,255,0.12)",
  up: "rgba(0, 200, 83, 0.9)",
  down: "rgba(255, 82, 82, 0.9)",
};

export function MinuteChart({ data, spot, isLoading }: MinuteChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const allSeriesRefs = useRef<ReturnType<IChartApi["addSeries"]>[]>([]);

  const preClose = spot?.pre_close ?? spot?.open ?? 0;

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
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      width: containerRef.current.clientWidth,
      height: 500,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    chartRef.current = chart;
    allSeriesRefs.current = [lineSeries];
  }, []);

  // Set data
  useEffect(() => {
    if (!data.length) return;

    if (!chartRef.current) {
      initChart();
    }
    if (!chartRef.current || !allSeriesRefs.current.length) return;

    const chart = chartRef.current;
    const lineData = toLineData(data);

    // Update main line
    allSeriesRefs.current[0]?.setData(lineData);

    // Remove old preClose lines (index 1+)
    for (let i = allSeriesRefs.current.length - 1; i >= 1; i--) {
      chart.removeSeries(allSeriesRefs.current[i]);
      allSeriesRefs.current.pop();
    }

    // Add preClose reference line
    if (preClose > 0) {
      const firstTime = lineData[0]?.time;
      const lastTime = lineData[lineData.length - 1]?.time;
      if (firstTime && lastTime) {
        const preCloseSeries = chart.addSeries(LineSeries, {
          color: "rgba(255,255,255,0.2)",
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        preCloseSeries.setData([
          { time: firstTime, value: preClose },
          { time: lastTime, value: preClose },
        ]);
        allSeriesRefs.current.push(preCloseSeries);
      }
    }

    // Dynamically update line color based on current vs preClose
    const lastVal = lineData[lineData.length - 1]?.value ?? 0;
    const isUp = lastVal >= preClose;
    allSeriesRefs.current[0]?.applyOptions({
      color: isUp ? CHART_COLORS.up : CHART_COLORS.down,
    });

    chart.timeScale().fitContent();
  }, [data, initChart, preClose]);

  // Handle resize
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
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[500px] text-muted-foreground text-sm">
        暂无分时数据（或非交易时段）
      </div>
    );
  }

  return (
    <div>
      {/* Reference Price Line */}
      {preClose > 0 && (
        <div className="flex items-center gap-2 px-2 pb-2 text-xs text-muted-foreground">
          <span
            className="inline-block border-t border-dashed w-4"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          />
          昨收 {preClose.toFixed(2)}
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
