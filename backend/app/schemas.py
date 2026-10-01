from enum import Enum
from typing import Any

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
