from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services import broadcaster, market_data, watchlist_store

router = APIRouter()


@router.websocket("/prices")
async def prices_ws(websocket: WebSocket):
    await broadcaster.manager.connect(websocket)
    try:
        symbols = watchlist_store.symbols()
        if symbols:
            quotes = await market_data.fetch_quotes(symbols)
            await websocket.send_json(
                {
                    "type": "quotes",
                    "quotes": {symbol: quote.model_dump() for symbol, quote in quotes.items()},
                }
            )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await broadcaster.manager.disconnect(websocket)
