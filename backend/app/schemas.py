from datetime import datetime, timezone
from enum import Enum
from typing import Any
import uuid

from pydantic import BaseModel, Field

class SignalingEventType(str, Enum):
    JOIN = "JOIN"
    JOINED = "JOINED"
    PEER_JOINED = "PEER_JOINED"
    PEER_LEFT = "PEER_LEFT"
    OFFER = "OFFER"
    ANSWER = "ANSWER"
    ICE_CANDIDATE = "ICE_CANDIDATE"
    MESSAGE = "MESSAGE"
    TRANSFER_UPDATE = "TRANSFER_UPDATE"
    ERROR = "ERROR"
    PING = "PING"
    PONG = "PONG"

class SignalingMessage(BaseModel):
    type: SignalingEventType
    session_code: str
    sender_peer_id: str = ""
    target_peer_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)

class TransferCreate(BaseModel):
    name: str = Field(default="Untitled Transfer", max_length=128)

class TransferPeerResponse(BaseModel):
    id: uuid.UUID | str = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID | str = ""
    device_id: uuid.UUID | str = ""
    peer_id: str
    username: str | None = None
    device_name: str | None = None
    role: str = "peer"
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_online: bool = True

    model_config = {"from_attributes": True}

class TransferResponse(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    session_code: str
    name: str
    status: str
    created_at: datetime
    completed_at: datetime | None = None
    peers_count: int = 0
    peers: list[TransferPeerResponse] = []

    model_config = {"from_attributes": True}

class JoinTransferRequest(BaseModel):
    session_code: str = Field(min_length=6, max_length=16)
    device_id: uuid.UUID
    peer_id: str = Field(min_length=6, max_length=64)

__all__ = [
    "SignalingEventType",
    "SignalingMessage",
    "TransferCreate",
    "TransferPeerResponse",
    "TransferResponse",
    "JoinTransferRequest",
]
