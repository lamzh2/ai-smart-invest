"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Globe,
  Building2,
  MessageSquare,
  Search,
  Bell,
  Trophy,
  LineChart,
  BarChart3,
  History,
  Star,
  Info,
  Settings,
} from "lucide-react";

const navigation = [
  {
    group: "导航",
    items: [
      { href: "/", label: "仪表盘", icon: LayoutDashboard },
      { href: "/settings", label: "设置", icon: Settings },
    ],
  },
  {
    group: "行情",
    items: [
      { href: "/market", label: "实时行情", icon: TrendingUp },
      { href: "/sectors", label: "板块分析", icon: PieChart },
      { href: "/northbound", label: "北向资金", icon: Globe },
    ],
  },
  {
    group: "AI 智能体",
    items: [
      { href: "/committee", label: "投资委员会", icon: Building2, highlight: true },
      { href: "/chat", label: "AI 对话", icon: MessageSquare },
      { href: "/deep-research", label: "Deep Research", icon: Search },
      { href: "/screener", label: "AI 选股", icon: BarChart3 },
      { href: "/monitor", label: "AI 盯盘", icon: Bell },
      { href: "/leaderboard", label: "大师排行榜", icon: Trophy },
    ],
  },
  {
    group: "分析工具",
    items: [
      { href: "/technical", label: "技术分析", icon: LineChart },
      { href: "/fundamental", label: "基本面分析", icon: BarChart3 },
    ],
  },
  {
    group: "记录",
    items: [
      { href: "/history", label: "分析历史", icon: History },
      { href: "/watchlist", label: "我的自选股", icon: Star },
      { href: "/about", label: "关于", icon: Info },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">AI</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold tracking-tight">
            AI 智投
          </span>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-4">
          {navigation.map((group) => (
            <div key={group.group}>
              {!sidebarCollapsed && (
                <h4 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.group}
                </h4>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-3",
                        sidebarCollapsed && "justify-center px-2",
                        item.highlight &&
                          !isActive &&
                          "text-primary hover:text-primary"
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
