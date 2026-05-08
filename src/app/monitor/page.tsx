"use client";

/**
 * AI 盯盘页面 — 预警创建、活跃预警列表、触发历史
 */
import { useState } from "react";
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  Loader2,
  Eye,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  stockCode: string;
  stockName: string;
  type: "price" | "change" | "volume" | "breakout";
  condition: string;
  value: number;
  direction: "above" | "below";
  status: "active" | "triggered" | "disabled";
  createdAt: string;
  triggeredAt?: string;
  triggeredValue?: number;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: "a1", stockCode: "000001", stockName: "平安银行", type: "price",
    condition: "股价", value: 12.50, direction: "above", status: "active",
    createdAt: "2026-05-08 09:30",
  },
  {
    id: "a2", stockCode: "600519", stockName: "贵州茅台", type: "change",
    condition: "涨跌幅", value: 5, direction: "above", status: "active",
    createdAt: "2026-05-07 14:20",
  },
  {
    id: "a3", stockCode: "300750", stockName: "宁德时代", type: "price",
    condition: "股价", value: 180.00, direction: "below", status: "triggered",
    createdAt: "2026-05-06 10:00", triggeredAt: "2026-05-08 13:15", triggeredValue: 178.50,
  },
  {
    id: "a4", stockCode: "000858", stockName: "五粮液", type: "volume",
    condition: "成交量", value: 500000, direction: "above", status: "disabled",
    createdAt: "2026-05-05 11:00",
  },
  {
    id: "a5", stockCode: "002594", stockName: "比亚迪", type: "breakout",
    condition: "突破", value: 320, direction: "above", status: "active",
    createdAt: "2026-05-08 08:45",
  },
];

const ALERT_TYPES = [
  { value: "price", label: "价格预警" },
  { value: "change", label: "涨跌幅预警" },
  { value: "volume", label: "成交量预警" },
  { value: "breakout", label: "突破预警" },
];

export default function MonitorPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    stockCode: "", stockName: "",
    type: "price" as Alert["type"],
    value: "", direction: "above" as Alert["direction"],
  });

  const addAlert = () => {
    if (!form.stockCode || !form.value) return;
    const newAlert: Alert = {
      id: `a${Date.now()}`,
      stockCode: form.stockCode,
      stockName: form.stockName || form.stockCode,
      type: form.type,
      condition: ALERT_TYPES.find((t) => t.value === form.type)?.label || "",
      value: parseFloat(form.value),
      direction: form.direction,
      status: "active",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setForm({ stockCode: "", stockName: "", type: "price", value: "", direction: "above" });
    setIsCreating(false);
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? ("disabled" as const) : ("active" as const) }
          : a,
      ),
    );
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const activeCount = alerts.filter((a) => a.status === "active").length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
            <Bell className="size-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 盯盘</h1>
            <p className="text-sm text-muted-foreground">
              智能预警 · {activeCount} 个活跃
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus className="size-4" />
          新建预警
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="mt-4 p-3 border-primary/30 bg-primary/5">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">股票代码</Label>
              <Input
                placeholder="000001"
                value={form.stockCode}
                onChange={(e) => setForm({ ...form, stockCode: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">名称(可选)</Label>
              <Input
                placeholder="平安银行"
                value={form.stockName}
                onChange={(e) => setForm({ ...form, stockName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">预警类型</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Alert["type"] ?? "price" })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">阈值</Label>
              <div className="flex gap-1">
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as Alert["direction"] ?? "above" })}>
                  <SelectTrigger className="h-8 w-14 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above" className="text-xs">突破</SelectItem>
                    <SelectItem value="below" className="text-xs">跌破</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="价格"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>取消</Button>
            <Button size="sm" onClick={addAlert} disabled={!form.stockCode || !form.value}>
              创建预警
            </Button>
          </div>
        </Card>
      )}

      {/* Alert list */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={cn(
              "p-3 border-border/30 hover:border-primary/20 hover:bg-muted/5 transition-colors",
              alert.status === "triggered" && "border-amber-500/30 bg-amber-500/5",
              alert.status === "disabled" && "opacity-50",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {alert.status === "triggered" ? (
                  <BellRing className="size-5 text-amber-400" />
                ) : alert.status === "active" ? (
                  <Eye className="size-5 text-primary/70" />
                ) : (
                  <Clock className="size-5 text-muted-foreground/40" />
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{alert.stockName}</span>
                    <span className="text-xs text-muted-foreground">{alert.stockCode}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        alert.status === "active" && "border-primary/30 text-primary",
                        alert.status === "triggered" && "border-amber-500/30 text-amber-400",
                        alert.status === "disabled" && "border-border/30 text-muted-foreground",
                      )}
                    >
                      {alert.status === "active" ? "监控中" : alert.status === "triggered" ? "已触发" : "已暂停"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alert.condition}{" "}
                    {alert.direction === "above" ? (
                      <ArrowUp className="inline size-3 text-red-400" />
                    ) : (
                      <ArrowDown className="inline size-3 text-emerald-400" />
                    )}{" "}
                    {alert.value}
                    {alert.type === "change" ? "%" : alert.type === "volume" ? "手" : "元"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {alert.status === "triggered" && alert.triggeredAt && (
                  <span className="text-[10px] text-amber-400/70">
                    触发于 {alert.triggeredAt} @ {alert.triggeredValue}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">
                  创建 {alert.createdAt}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleAlert(alert.id)}
                >
                  {alert.status === "active" ? (
                    <XCircle className="size-4 text-muted-foreground" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => removeAlert(alert.id)}
                >
                  <Trash2 className="size-4 text-muted-foreground/50" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell className="size-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">暂无预警，点击「新建预警」开始</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground/40 shrink-0">
        ⚠️ 盯盘功能为本地模拟，实际实时推送需后端 WebSocket 支持
      </p>
    </div>
  );
}
