"""Transfer sessions REST endpoints (100% ephemeral in-memory, zero-database)."""

from datetime import datetime, timezone
import logging
import secrets
from typing import Any
import uuid

from fastapi import APIRouter, status

from app.schemas import (
    JoinTransferRequest,
    TransferCreate,
    TransferPeerResponse,
    TransferResponse,
)
from app.websockets.manager import signaling_manager

logger = logging.getLogger("p2sync.transfers")
router = APIRouter(prefix="/transfers", tags=["transfers"])

def generate_session_code() -> str:
    """Generate a clean, easy-to-type room code like NUT-A1B2C."""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    random_part = "".join(secrets.choice(chars) for step in range(5))
    return f"NUT-{random_part}"

@router.post(
    "/create",
    response_model=TransferResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_transfer(
    data: TransferCreate = TransferCreate(),
) -> TransferResponse:
    """Create a new ephemeral file transfer session with a unique session code."""
    code = generate_session_code()
    logger.info("Generated ephemeral room session %s", code)

    now = datetime.now(timezone.utc)
    return TransferResponse(
        id=uuid.uuid4(),
        creator_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        session_code=code,
        name=data.name or "P2P Transfer Room",
        status="created",
        created_at=now,
        completed_at=None,
        peers_count=0,
        peers=[],
    )

@router.get(
    "/{session_code}",
    response_model=TransferResponse,
)
async def get_transfer_details(
    session_code: str,
) -> TransferResponse:
    """Look up transfer session metadata and active peers by session code."""
    code = session_code.upper().strip()
    active_peers = signaling_manager.get_room_peers(code)
    now = datetime.now(timezone.utc)

    return TransferResponse(
        id=uuid.uuid4(),
        creator_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        session_code=code,
        name="P2P Transfer Room",
        status="active" if active_peers else "created",
        created_at=now,
        completed_at=None,
        peers_count=len(active_peers),
        peers=[TransferPeerResponse(**p) for p in active_peers],
    )

@router.post(
    "/{session_code}/join",
    response_model=TransferResponse,
)
async def join_transfer_session(
    session_code: str,
    data: JoinTransferRequest,
) -> TransferResponse:
    """Validate and join an existing ephemeral transfer session."""
    code = session_code.upper().strip()
    active_peers = signaling_manager.get_room_peers(code)
    now = datetime.now(timezone.utc)

    return TransferResponse(
        id=uuid.uuid4(),
        creator_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        session_code=code,
        name="P2P Transfer Room",
        status="active" if active_peers else "created",
        created_at=now,
        completed_at=None,
        peers_count=len(active_peers),
        peers=[TransferPeerResponse(**p) for p in active_peers],
    )
