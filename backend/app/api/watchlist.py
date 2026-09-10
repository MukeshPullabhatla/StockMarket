from fastapi import APIRouter, HTTPException

from app.models.schemas import WatchlistAddRequest, WatchlistItem
from app.services import market_data, watchlist_store

router = APIRouter()


@router.get("", response_model=list[WatchlistItem])
async def list_watchlist():
    return [
        WatchlistItem(symbol=e.symbol, name=e.name, added_at=e.added_at.isoformat())
        for e in watchlist_store.list_watchlist()
    ]


@router.post("", response_model=WatchlistItem, status_code=201)
async def add_to_watchlist(request: WatchlistAddRequest):
    symbol = request.symbol.strip().upper()
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required.")
    if not await market_data.symbol_exists(symbol):
        raise HTTPException(status_code=404, detail=f"Unknown or unpriced symbol: {symbol}")
    name = await market_data.fetch_symbol_name(symbol)
    entry = watchlist_store.add_symbol(symbol, name)
    return WatchlistItem(symbol=entry.symbol, name=entry.name, added_at=entry.added_at.isoformat())


@router.delete("/{symbol}", status_code=204)
async def remove_from_watchlist(symbol: str):
    if not watchlist_store.remove_symbol(symbol):
        raise HTTPException(status_code=404, detail=f"Symbol not in watchlist: {symbol}")
