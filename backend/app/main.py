import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_v1_router
from app.config import settings
from app.websockets.router import router as ws_router

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("ShareNut")

logging.getLogger("asyncio").setLevel(logging.ERROR)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting ShareNut backend (in-memory ephemeral)...")
    yield
    logger.info("Shutting down ShareNut backend...")

app = FastAPI(
    title=settings.app_name,
    description="Decentralized, multi-peer, resumable file transfer",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)
app.include_router(ws_router)

@app.get("/", tags=["root"])
async def root() -> dict:
    """Root endpoint providing service status and API documentation links."""
    return {
        "service": "ShareNut-backend",
        "status": "online",
        "version": "0.1.0",
        "docs_url": "/docs",
        "health_url": "/api/v1/health",
        "endpoints": {
            "health": "/api/v1/health",
            "network_info": "/api/v1/network/info",
            "lan_prepare_upload": "/api/v1/lan-transfer/prepare-upload",
            "lan_upload": "/api/v1/lan-transfer/upload",
            "lan_download": "/api/v1/lan-transfer/download/{file_id}",
            "room_files": "/api/v1/lan-transfer/room/{room_code}/files",
            "websocket_signaling": "/ws/{session_code}",
        },
    }

@app.get("/api/v1/health", tags=["health"])
async def health_check() -> dict:
    """Simple health check endpoint."""
    return {"status": "healthy", "service": "ShareNut"}
