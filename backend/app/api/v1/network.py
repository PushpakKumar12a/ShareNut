import socket
from fastapi import APIRouter

router = APIRouter(prefix="/network", tags=["network"])

@router.get("/info")
async def get_network_info() -> dict:
    lan_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        lan_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    return {
        "lan_ip": lan_ip,
        "frontend_port": 3000,
        "backend_port": 8000,
    }