from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.infrastructure.websocket.manager import manager
from loguru import logger

router = APIRouter()

@router.websocket("/classroom/{lecture_id}")
async def ws_classroom(websocket: WebSocket, lecture_id: int):
    channel = f"classroom_{lecture_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            # Maintain connection, listen for any messages from client if needed
            data = await websocket.receive_text()
            # For now, just echo or ignore since data is mostly outbound from backend
            logger.debug(f"Received from client in {channel}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
        logger.info(f"Client disconnected from {channel}")
    except Exception as e:
        logger.error(f"WebSocket error in {channel}: {str(e)}")
        manager.disconnect(websocket, channel)

@router.websocket("/twin/{lecture_id}")
async def ws_twin(websocket: WebSocket, lecture_id: int):
    channel = f"twin_{lecture_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received from client in {channel}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        logger.error(f"WebSocket error in {channel}: {str(e)}")
        manager.disconnect(websocket, channel)

@router.websocket("/copilot/{lecture_id}")
async def ws_copilot(websocket: WebSocket, lecture_id: int):
    channel = f"copilot_{lecture_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received from client in {channel}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        logger.error(f"WebSocket error in {channel}: {str(e)}")
        manager.disconnect(websocket, channel)

@router.websocket("/analytics/{lecture_id}")
async def ws_analytics(websocket: WebSocket, lecture_id: int):
    channel = f"analytics_{lecture_id}"
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received from client in {channel}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        logger.error(f"WebSocket error in {channel}: {str(e)}")
        manager.disconnect(websocket, channel)
