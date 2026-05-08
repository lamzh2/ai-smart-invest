"use client";

/**
 * FilterPanel — AI 选股多维度筛选表单
 */
import { useState, useCallback } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ScreenerFilters {
  sector?: string;
  marketCapMin?: string;
  marketCapMax?: string;
  peMin?: string;
  peMax?: string;
  roeMin?: string;
  revenueGrowthMin?: string;
  dividendYieldMin?: string;
  strategy?: string;
  riskLevel?: string;
  customPrompt?: string;
}

interface FilterPanelProps {
  filters: ScreenerFilters;
  onChange: (filters: ScreenerFilters) => void;
  onSearch: () => void;
  isLoading: boolean;
  className?: string;
}

const SECTORS = [
  "全部行业", "银行", "券商", "保险", "白酒", "食品饮料", "医药生物",
  "医疗器械", "新能源", "光伏", "风电", "锂电池", "半导体", "消费电子",
  "人工智能", "云计算", "汽车", "军工", "房地产", "建筑建材", "煤炭",
  "石油石化", "有色", "钢铁", "电力", "交通运输", "农林牧渔",
];

const STRATEGIES = [
  { value: "value", label: "价值投资（低估值+高股息）" },
  { value: "growth", label: "成长投资（高增速+高ROE）" },
  { value: "momentum", label: "动量策略（近期强势+趋势）" },
  { value: "quality", label: "质量策略（高ROE+低负债）" },
  { value: "custom", label: "自定义条件" },
];

const RISK_LEVELS = [
  { value: "low", label: "低风险（大盘蓝筹）" },
  { value: "medium", label: "中等风险" },
  { value: "high", label: "高风险（小盘成长）" },
  { value: "any", label: "不限" },
];

export function FilterPanel({ filters, onChange, onSearch, isLoading, className }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const update = useCallback(
    (key: keyof ScreenerFilters, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const reset = useCallback(() => {
    onChange({});
  }, [onChange]);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className={cn("rounded-lg border border-border/30 bg-card/50", className)}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary/70" />
          <span className="text-sm font-medium">筛选条件</span>
          {hasFilters && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              已设置
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); reset(); }}
            >
              <RotateCcw className="size-3" />
              重置
            </Button>
          )}
          <X
            className={cn(
              "size-4 text-muted-foreground/50 transition-transform duration-200",
              !expanded && "rotate-45",
            )}
          />
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Row 1: Sector + Strategy */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">行业板块</Label>
              <Select value={filters.sector || ""} onValueChange={(v) => update("sector", (v ?? "") === "全部行业" ? "" : (v ?? ""))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="全部行业" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">投资策略</Label>
              <Select value={filters.strategy || ""} onValueChange={(v) => update("strategy", v ?? "")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="选择策略" />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Market Cap */}
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">市值范围（亿元）</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="最小"
                type="number"
                value={filters.marketCapMin || ""}
                onChange={(e) => update("marketCapMin", e.target.value)}
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                placeholder="最大"
                type="number"
                value={filters.marketCapMax || ""}
                onChange={(e) => update("marketCapMax", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Row 3: PE + ROE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">市盈率 PE</Label>
              <div className="flex items-center gap-1">
                <Input
                  placeholder="最低"
                  type="number"
                  value={filters.peMin || ""}
                  onChange={(e) => update("peMin", e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-[10px] text-muted-foreground">-</span>
                <Input
                  placeholder="最高"
                  type="number"
                  value={filters.peMax || ""}
                  onChange={(e) => update("peMax", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">ROE 最低(%)</Label>
              <Input
                placeholder="如 15"
                type="number"
                value={filters.roeMin || ""}
                onChange={(e) => update("roeMin", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Row 4: Revenue Growth + Dividend */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">营收增速最低(%)</Label>
              <Input
                placeholder="如 20"
                type="number"
                value={filters.revenueGrowthMin || ""}
                onChange={(e) => update("revenueGrowthMin", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">股息率最低(%)</Label>
              <Input
                placeholder="如 2"
                type="number"
                value={filters.dividendYieldMin || ""}
                onChange={(e) => update("dividendYieldMin", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Row 5: Risk Level */}
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">风险偏好</Label>
            <Select value={filters.riskLevel || ""} onValueChange={(v) => update("riskLevel", v ?? "")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="不限" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">自定义描述（AI 理解）</Label>
            <Input
              placeholder="如：筛选低估值高股息且近期北向资金持续流入的标的"
              value={filters.customPrompt || ""}
              onChange={(e) => update("customPrompt", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Search button */}
          <Button
            className="w-full gap-2 h-9"
            onClick={onSearch}
            disabled={isLoading}
          >
            {isLoading ? "AI 筛选中..." : "AI 智能选股"}
          </Button>
        </div>
      )}
    </div>
  );
}
