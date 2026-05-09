/**
 * 行情数据 API — 直接调用东方财富公开 REST 接口
 * 路由: /api/market/[endpoint]
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getIndices,
  getSpotList,
  getStockDetail,
  getKline,
  getSectors,
  getNorthbound,
  getMinuteData,
  searchStocks,
} from "@/lib/market-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path[0];
  const searchParams = request.nextUrl.searchParams;

  try {
    let data: any;

    switch (endpoint) {
      case "indices": {
        data = await getIndices();
        break;
      }

      case "spot": {
        const page = parseInt(searchParams.get("page") || "1");
        const size = parseInt(searchParams.get("size") || "50");
        const sort = searchParams.get("sort") || "f3";
        const order = searchParams.get("order") || "desc";
        data = await getSpotList(page, size, sort, order);
        break;
      }

      case "stock": {
        const code = path[1];
        if (!code) {
          return NextResponse.json({ error: "股票代码必填" }, { status: 400 });
        }
        data = await getStockDetail(code);
        break;
      }

      case "kline": {
        const code = path[1];
        if (!code) {
          return NextResponse.json({ error: "股票代码必填" }, { status: 400 });
        }
        const period = searchParams.get("period") || "daily";
        const limit = parseInt(searchParams.get("limit") || "250");
        data = await getKline(code, period, limit);
        break;
      }

      case "sectors": {
        data = await getSectors();
        break;
      }

      case "northbound": {
        const days = parseInt(searchParams.get("days") || "30");
        data = await getNorthbound(days);
        break;
      }

      case "minute": {
        const code = path[1];
        if (!code) {
          return NextResponse.json({ error: "股票代码必填" }, { status: 400 });
        }
        const freq = searchParams.get("freq") || "1";
        data = await getMinuteData(code, freq);
        break;
      }

      case "search": {
        const keyword = searchParams.get("q") || "";
        data = await searchStocks(keyword);
        break;
      }

      default:
        return NextResponse.json(
          { error: `未知端点: ${endpoint}` },
          { status: 404 }
        );
    }

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error(`[Market API] ${endpoint} error:`, error);
    return NextResponse.json(
      { success: false, data: null, message: "数据获取失败" },
      { status: 502 }
    );
  }
}
