"use client";

/**
 * 设置页 — 个人资料 + 偏好配置
 */
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, User, Mail, Save, Bell, Palette, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface UserPrefs {
  theme: "dark" | "light" | "system";
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  language: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: (session?.user?.name as string) || "",
    email: (session?.user?.email as string) || "",
  });

  const [prefs, setPrefs] = useState<UserPrefs>({
    theme: "dark",
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    language: "zh-CN",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Settings className="size-5 text-foreground/70" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">设置</h1>
          <p className="text-sm text-muted-foreground">个人资料与偏好</p>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto space-y-4">
        {/* Profile */}
        <Card className="p-4 border-border/30">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <User className="size-4 text-primary/70" /> 个人资料
          </h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">用户名</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">邮箱</Label>
              <Input
                value={profile.email}
                disabled
                className="h-9 text-sm opacity-60"
              />
              <p className="text-[10px] text-muted-foreground/50">邮箱不可修改</p>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-4 border-border/30">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Palette className="size-4 text-primary/70" /> 偏好设置
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">主题</p>
                <p className="text-xs text-muted-foreground">目前仅支持暗色主题</p>
              </div>
              <Badge variant="outline" className="text-xs">暗色</Badge>
            </div>
            <Separator className="border-border/20" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">消息通知</p>
                <p className="text-xs text-muted-foreground">AI 分析完成时通知</p>
              </div>
              <Switch
                checked={prefs.notifications}
                onCheckedChange={(v: boolean) => setPrefs({ ...prefs, notifications: v })}
              />
            </div>
            <Separator className="border-border/20" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">自动刷新行情</p>
                <p className="text-xs text-muted-foreground">每 {prefs.refreshInterval} 秒刷新</p>
              </div>
              <Switch
                checked={prefs.autoRefresh}
                onCheckedChange={(v) => setPrefs({ ...prefs, autoRefresh: v })}
              />
            </div>
            <Separator className="border-border/20" />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">刷新间隔 (秒)</Label>
              <Input
                type="number"
                min={10}
                max={300}
                value={prefs.refreshInterval}
                onChange={(e) => setPrefs({ ...prefs, refreshInterval: Number(e.target.value) || 30 })}
                className="h-9 w-24 text-sm"
                disabled={!prefs.autoRefresh}
              />
            </div>
          </div>
        </Card>

        {/* AI Model Settings */}
        <Card className="p-4 border-border/30">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Shield className="size-4 text-primary/70" /> AI 模型
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">默认模型</span>
              <Badge variant="outline" className="text-xs">DeepSeek</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API 状态</span>
              <Badge className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30">已连接</Badge>
            </div>
          </div>
        </Card>

        {/* Save */}
        <Button onClick={handleSave} className="w-full gap-2">
          {saved ? (
            <>✅ 已保存</>
          ) : (
            <><Save className="size-4" /> 保存设置</>
          )}
        </Button>
      </div>
    </div>
  );
}
