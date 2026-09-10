import asyncio
import logging

from fastapi import WebSocket

from app.config import MOVER_CATEGORIES, POLL_INTERVAL_SECONDS
from app.services import market_data, watchlist_store

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, message: dict) -> None:
        async with self._lock:
            targets = list(self._connections)
        for websocket in targets:
            try:
                await websocket.send_json(message)
            except Exception:
                await self.disconnect(websocket)


manager = ConnectionManager()
_poll_task: asyncio.Task | None = None


async def _poll_loop() -> None:
    while True:
        try:
            watch_symbols = watchlist_store.symbols()
            mover_symbols: list[str] = []
            for category in MOVER_CATEGORIES:
                movers = await market_data.fetch_movers(category, count=10)
                mover_symbols.extend(m.symbol for m in movers if m.symbol)

            all_symbols = sorted(set(watch_symbols) | set(mover_symbols))
            if all_symbols:
                quotes = await market_data.fetch_quotes(all_symbols)
                await manager.broadcast(
                    {
                        "type": "quotes",
                        "quotes": {symbol: quote.model_dump() for symbol, quote in quotes.items()},
                    }
                )
        except Exception:
            logger.exception("Price poll loop iteration failed")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


def start_poll_loop() -> None:
    global _poll_task
    if _poll_task is None:
        _poll_task = asyncio.create_task(_poll_loop())


def stop_poll_loop() -> None:
    global _poll_task
    if _poll_task is not None:
        _poll_task.cancel()
        _poll_task = None
