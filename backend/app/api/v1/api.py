from fastapi import APIRouter

from app.api.v1.lan_transfer import router as lan_transfer_router
from app.api.v1.network import router as network_router
from app.api.v1.transfers import router as transfers_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(network_router)
api_v1_router.include_router(lan_transfer_router)
api_v1_router.include_router(transfers_router)