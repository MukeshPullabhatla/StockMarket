import secrets

from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import ADMIN_KEY
from app.models.schemas import WatchlistAddRequest, WatchlistItem
from app.services import market_data, watchlist_store

router = APIRouter()


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    """Only the site owner (holding ADMIN_KEY) may change the shared default watchlist."""
    if not ADMIN_KEY or not x_admin_key or not secrets.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="Only the site owner can change the shared watchlist.")


@router.get("", response_model=list[WatchlistItem])
async def list_watchlist():
    return [
        WatchlistItem(symbol=e.symbol, name=e.name, added_at=e.added_at.isoformat())
        for e in watchlist_store.list_watchlist()
    ]


@router.post("", response_model=WatchlistItem, status_code=201, dependencies=[Depends(require_admin)])
async def add_to_watchlist(request: WatchlistAddRequest):
    symbol = request.symbol.strip().upper()
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbol is required.")
    if not await market_data.symbol_exists(symbol):
        raise HTTPException(status_code=404, detail=f"Unknown or unpriced symbol: {symbol}")
    name = await market_data.fetch_symbol_name(symbol)
    entry = watchlist_store.add_symbol(symbol, name)
    return WatchlistItem(symbol=entry.symbol, name=entry.name, added_at=entry.added_at.isoformat())


@router.delete("/{symbol}", status_code=204, dependencies=[Depends(require_admin)])
async def remove_from_watchlist(symbol: str):
    if not watchlist_store.remove_symbol(symbol):
        raise HTTPException(status_code=404, detail=f"Symbol not in watchlist: {symbol}")
