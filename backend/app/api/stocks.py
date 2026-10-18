from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import HistoryPoint, MoverCategory, Quote, SymbolInfo
from app.services import market_data

router = APIRouter()

MAX_QUOTE_SYMBOLS = 25


@router.get("/quote", response_model=dict[str, Quote])
async def get_quote(symbols: str = Query(..., description="Comma-separated ticker symbols")):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(status_code=400, detail="At least one symbol is required.")
    if len(symbol_list) > MAX_QUOTE_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"At most {MAX_QUOTE_SYMBOLS} symbols per request.")
    quotes = await market_data.fetch_quotes(symbol_list)
    return {symbol: quote for symbol, quote in quotes.items()}


@router.get("/history/{symbol}", response_model=list[HistoryPoint])
async def get_history(symbol: str, period: str = "1mo", interval: str = "1d"):
    return await market_data.fetch_history(symbol.upper(), period=period, interval=interval)


@router.get("/movers/{category}", response_model=list[Quote])
async def get_movers(category: MoverCategory):
    return await market_data.fetch_movers(category)


@router.get("/symbol/{symbol}", response_model=SymbolInfo)
async def lookup_symbol(symbol: str):
    """Validate a ticker for a visitor's personal watchlist."""
    symbol = symbol.strip().upper()
    if not symbol or len(symbol) > 15 or not await market_data.symbol_exists(symbol):
        raise HTTPException(status_code=404, detail=f"Unknown or unpriced symbol: {symbol}")
    return SymbolInfo(symbol=symbol, name=await market_data.fetch_symbol_name(symbol))
