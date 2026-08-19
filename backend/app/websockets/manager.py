"""WebSocket connection and signaling room manager for WebRTC peer discovery."""

import logging
from typing import Any
from fastapi import WebSocket

from app.schemas import SignalingEventType, SignalingMessage
logger = logging.getLogger("ShareNut.signaling")

class SignalingManager:
    def __init__(self) -> None:

        self.rooms: dict[str, dict[str, WebSocket]] = {}

        self.peer_meta: dict[str, dict[str, dict[str, Any]]] = {}

    async def connect(
        self,
        session_code: str,
        peer_id: str,
        websocket: WebSocket,
        metadata: dict[str, Any],
    ) -> None:
        """Register a new peer WebSocket connection in a signaling room."""
        if getattr(websocket, "client_state", None) and websocket.client_state.name != "CONNECTED":
            await websocket.accept()

        code = session_code.upper()
        if code not in self.rooms:
            self.rooms[code] = {}
            self.peer_meta[code] = {}

        if peer_id in self.rooms[code]:
            old_ws = self.rooms[code].pop(peer_id, None)
            self.peer_meta[code].pop(peer_id, None)
            if old_ws:
                try:
                    await old_ws.close()
                except Exception:
                    pass

        self.rooms[code][peer_id] = websocket
        self.peer_meta[code][peer_id] = metadata

        logger.info(
            "Peer connected to room %s: %s (%s)",
            code,
            metadata.get("username"),
            peer_id,
        )

        peer_joined_msg = SignalingMessage(
            type=SignalingEventType.PEER_JOINED,
            session_code=code,
            sender_peer_id=peer_id,
            payload={
                "peer_id": peer_id,
                "user_id": str(metadata.get("user_id")),
                "username": metadata.get("username"),
                "device_id": str(metadata.get("device_id")),
                "device_name": metadata.get("device_name"),
                "role": metadata.get("role", "peer"),
            },
        )
        await self.broadcast_room(code, peer_joined_msg, exclude_peer_id=peer_id)

        existing_peers = [
            {
                "peer_id": pid,
                "user_id": str(meta.get("user_id")),
                "username": meta.get("username"),
                "device_id": str(meta.get("device_id")),
                "device_name": meta.get("device_name"),
                "role": meta.get("role", "peer"),
            }
            for pid, meta in self.peer_meta[code].items()
            if pid != peer_id
        ]

        joined_ack = SignalingMessage(
            type=SignalingEventType.JOINED,
            session_code=code,
            sender_peer_id="server",
            target_peer_id=peer_id,
            payload={
                "your_peer_id": peer_id,
                "existing_peers": existing_peers,
            },
        )
        await self.send_direct(code, peer_id, joined_ack)

    async def disconnect(
        self,
        session_code: str,
        peer_id: str,
        websocket: WebSocket | None = None,
    ) -> None:
        """Remove a peer from a signaling room and notify remaining peers."""
        code = session_code.upper()
        if code not in self.rooms:
            return

        current_ws = self.rooms[code].get(peer_id)
        if websocket is not None and current_ws is not None and current_ws is not websocket:

            logger.debug("Ignoring disconnect from superseded websocket for %s", peer_id)
            return

        self.rooms[code].pop(peer_id, None)
        meta = self.peer_meta[code].pop(peer_id, None)

        if not self.rooms[code]:

            self.rooms.pop(code, None)
            self.peer_meta.pop(code, None)
        else:

            peer_left_msg = SignalingMessage(
                type=SignalingEventType.PEER_LEFT,
                session_code=code,
                sender_peer_id=peer_id,
                payload={
                    "peer_id": peer_id,
                    "username": meta.get("username") if meta else "Unknown",
                },
            )
            await self.broadcast_room(code, peer_left_msg)

        logger.info("Peer disconnected from room %s: %s", code, peer_id)

    def is_connected(self, ws: WebSocket) -> bool:
        from starlette.websockets import WebSocketState
        return (
            getattr(ws, "client_state", None) == WebSocketState.CONNECTED
            and getattr(ws, "application_state", None) == WebSocketState.CONNECTED
        )

    def prune_peer(self, code: str, peer_id: str) -> None:
        if code in self.rooms:
            self.rooms[code].pop(peer_id, None)
            self.peer_meta.get(code, {}).pop(peer_id, None)
            if not self.rooms[code]:
                self.rooms.pop(code, None)
                self.peer_meta.pop(code, None)

    async def send_direct(
        self,
        session_code: str,
        target_peer_id: str,
        message: SignalingMessage,
    ) -> bool:
        """Send a signaling message directly to a target peer."""
        code = session_code.upper()
        ws = self.rooms.get(code, {}).get(target_peer_id)
        if ws is None:
            return False

        if not self.is_connected(ws):
            self.prune_peer(code, target_peer_id)
            return False

        try:
            await ws.send_text(message.model_dump_json())
            return True
        except Exception:
            self.prune_peer(code, target_peer_id)
            return False

    async def broadcast_room(
        self,
        session_code: str,
        message: SignalingMessage,
        exclude_peer_id: str | None = None,
    ) -> None:
        """Broadcast a message to all connected peers in a room, optionally excluding sender."""
        code = session_code.upper()
        room_peers = self.rooms.get(code, {})
        json_data = message.model_dump_json()

        for pid, ws in list(room_peers.items()):
            if exclude_peer_id and pid == exclude_peer_id:
                continue
            if not self.is_connected(ws):
                self.prune_peer(code, pid)
                continue
            try:
                await ws.send_text(json_data)
            except Exception:
                self.prune_peer(code, pid)

    def get_room_peers(self, session_code: str) -> list[dict[str, Any]]:
        """Get list of active peer metadata in a room."""
        code = session_code.upper()
        return list(self.peer_meta.get(code, {}).values())

signaling_manager = SignalingManager()
