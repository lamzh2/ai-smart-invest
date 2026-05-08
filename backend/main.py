"""
AI 智投 — FastAPI 数据服务
A 股行情数据微服务，提供 RESTful API + WebSocket 实时推送
"""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Import routers
from routers import market, ai as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown events."""
    # Startup
    print("🚀 AI Smart Invest Data Service starting...")
    # TODO: Initialize Redis connection pool
    # TODO: Initialize cn-ashare / akShare warm-up
    yield
    # Shutdown
    print("👋 AI Smart Invest Data Service shutting down...")
    # TODO: Close Redis connections


app = FastAPI(
    title="AI 智投 Data Service",
    description="A 股行情数据微服务 — cn-ashare + akShare 双数据源",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(market.router, prefix="/api/v1/market", tags=["行情数据"])
app.include_router(ai_router.router, prefix="/api/v1/ai", tags=["AI 分析"])


@app.get("/api/v1/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "ok",
        "service": "ai-smart-invest-data",
        "version": "0.1.0",
        "python": "3.13",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
