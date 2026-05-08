"use client";

/**
 * StockCard — AI 对话中的内联股票信息卡片
 * 展示股票基本信息、实时价格与涨跌幅
 */
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StockSpot } from "@/types/market";

interface StockCardProps {
  code: string;
  name: string;
  price?: number;
  changePercent?: number;
  pe?: number | null;
  marketCap?: number;
  onClick?: () => void;
  isLoading?: boolean;
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "万亿";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "亿";
  return String(n);
}

export function StockCard({
  code,
  name,
  price,
  changePercent,
  pe,
  marketCap,
  onClick,
  isLoading,
}: StockCardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/60 p-3 space-y-2 max-w-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-32" />
      </Card>
    );
  }

  const isUp = (changePercent ?? 0) > 0;
  const isNeutral = (changePercent ?? 0) === 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/stock/${code}`);
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "border-border/60 bg-card/60 p-3 cursor-pointer max-w-sm",
        "hover:border-primary/20 hover:bg-accent/30 transition-all",
        isUp && "hover:border-up/20",
        !isUp && !isNeutral && "hover:border-down/20",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{code}</span>
          <span className="text-sm font-medium">{name}</span>
        </div>
        {changePercent != null && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              isUp && "text-up border-up/30",
              !isUp && !isNeutral && "text-down border-down/30",
              isNeutral && "text-muted-foreground",
            )}
          >
            {isUp ? (
              <TrendingUp className="size-3 mr-1" />
            ) : !isNeutral ? (
              <TrendingDown className="size-3 mr-1" />
            ) : (
              <Minus className="size-3 mr-1" />
            )}
            {isUp ? "+" : ""}
            {changePercent.toFixed(2)}%
          </Badge>
        )}
      </div>

      {/* Price */}
      {price != null && (
        <p
          className={cn(
            "text-lg font-bold font-mono tabular-nums",
            isUp ? "text-up" : !isNeutral ? "text-down" : "",
          )}
        >
          ¥{price.toFixed(2)}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
        {pe != null && <span>PE {pe.toFixed(1)}</span>}
        {marketCap != null && <span>市值 {formatMarketCap(marketCap)}</span>}
      </div>
    </Card>
  );
}
