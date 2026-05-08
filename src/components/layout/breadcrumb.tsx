"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  "": "仪表盘",
  market: "实时行情",
  stock: "股票详情",
  sectors: "板块分析",
  northbound: "北向资金",
  committee: "投资委员会",
  chat: "AI 对话",
  "deep-research": "Deep Research",
  screener: "AI 选股",
  monitor: "AI 盯盘",
  leaderboard: "大师排行榜",
  technical: "技术分析",
  fundamental: "基本面分析",
  history: "分析历史",
  watchlist: "我的自选股",
  about: "关于",
  settings: "设置",
  login: "登录",
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors hover:text-foreground"
      >
        <Home className="size-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label =
          routeLabels[segment] ||
          (segment.startsWith("0") || segment.startsWith("6")
            ? segment
            : segment);

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            {isLast ? (
              <span className="text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
