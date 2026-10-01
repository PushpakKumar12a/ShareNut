import socket
from fastapi import APIRouter

router = APIRouter(prefix="/network", tags=["network"])

cached_lan_ip: str | None = None

@router.get("/info")
async def get_network_info() -> dict:
    global cached_lan_ip
    if cached_lan_ip:
        return {
            "lan_ip": cached_lan_ip,
            "frontend_port": 3000,
            "backend_port": 8000,
        }

    lan_ip = "127.0.0.1"
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(0.5)
        sock.connect(("8.8.8.8", 80))
        lan_ip = sock.getsockname()[0]
        sock.close()
        cached_lan_ip = lan_ip
    except Exception:
        pass

    return {
        "lan_ip": lan_ip,
        "frontend_port": 3000,
        "backend_port": 8000,
    }