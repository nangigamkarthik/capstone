from fastapi import WebSocket
from typing import Dict, List
from loguru import logger

class ConnectionManager:
    def __init__(self):
        # Maps channel names (e.g., "lecture_1", "twin_1") to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info(f"WebSocket client connected to channel: {channel}. Total clients: {len(self.active_connections[channel])}")

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
                logger.info(f"WebSocket client disconnected from channel: {channel}. Remaining: {len(self.active_connections[channel])}")
            if not self.active_connections[channel]:
                del self.active_connections[channel]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict, channel: str):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting message to connection in channel {channel}: {str(e)}")
                    # Connection might be dead, but let disconnect handle it or clean up next cycle

manager = ConnectionManager()
