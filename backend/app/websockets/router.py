import json
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.schemas import SignalingEventType, SignalingMessage
from app.websockets.manager import signaling_manager

logger = logging.getLogger("ShareNut.ws")
router = APIRouter()

@router.websocket("/ws/transfers/{session_code}")
async def transfer_signaling_ws(
    websocket: WebSocket,
    session_code: str,
    peer_id: str = Query(...),
    device_id: str = Query(...),
    device_name: str = Query(default="Web Peer"),
    username: str | None = Query(default=None),
) -> None:
    
    await websocket.accept()
    code = session_code.upper().strip()
    display_name = username or device_name or "Web Peer"

    existing_peers = signaling_manager.get_room_peers(code)
    role = "host" if len(existing_peers) == 0 else "peer"

    metadata = {
        "user_id": peer_id,
        "username": display_name,
        "device_id": device_id,
        "device_name": device_name,
        "role": role,
    }

    await signaling_manager.connect(code, peer_id, websocket, metadata)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data_dict = json.loads(raw_data)
                msg = SignalingMessage(**data_dict)
                msg.sender_peer_id = peer_id
                msg.session_code = code

                if msg.type == SignalingEventType.PING:
                    pong_msg = SignalingMessage(
                        type=SignalingEventType.PONG,
                        session_code=code,
                        sender_peer_id="server",
                        target_peer_id=peer_id,
                    )
                    await websocket.send_text(pong_msg.model_dump_json())

                elif msg.type in (
                    SignalingEventType.OFFER,
                    SignalingEventType.ANSWER,
                    SignalingEventType.ICE_CANDIDATE,
                ):
                    if msg.target_peer_id:
                        await signaling_manager.send_direct(
                            code,
                            msg.target_peer_id,
                            msg,
                        )
                    else:
                        logger.warning(
                            "Received %s without target_peer_id from %s",
                            msg.type,
                            peer_id,
                        )

                elif msg.type == SignalingEventType.TRANSFER_UPDATE:

                    await signaling_manager.broadcast_room(
                        code,
                        msg,
                        exclude_peer_id=peer_id,
                    )

                elif msg.target_peer_id:

                    await signaling_manager.send_direct(
                        code,
                        msg.target_peer_id,
                        msg,
                    )
                else:

                    await signaling_manager.broadcast_room(
                        code,
                        msg,
                        exclude_peer_id=peer_id,
                    )

            except json.JSONDecodeError:
                logger.error("Invalid JSON from peer %s: %s", peer_id, raw_data[:100])
            except Exception as e:
                logger.error("Signaling error from peer %s: %s", peer_id, e)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: %s from room %s", peer_id, code)
        await signaling_manager.disconnect(code, peer_id, websocket)
    except Exception as e:
        logger.error("Signaling handler exception for %s: %s", peer_id, e)
        await signaling_manager.disconnect(code, peer_id, websocket)