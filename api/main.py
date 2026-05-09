"""
Vercel Python Serverless Handler for AI 智投 Backend
Proxies all /api/v1/* requests to the FastAPI app
"""
import sys
import os

# Add backend to sys.path so we can import routers
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI 智投 Data Service",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy import routers (they may fail if deps not available)
try:
    from routers import market, ai as ai_router
    app.include_router(market.router, prefix="/api/v1/market", tags=["行情数据"])
    app.include_router(ai_router.router, prefix="/api/v1/ai", tags=["AI 分析"])
except Exception as e:
    @app.get("/api/v1/health")
    async def health():
        return {"status": "degraded", "error": str(e)}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "ai-smart-invest-data", "version": "0.1.0"}

# ASGI entrypoint for Vercel
from mangum import Mangum
handler = Mangum(app, lifespan="off")
