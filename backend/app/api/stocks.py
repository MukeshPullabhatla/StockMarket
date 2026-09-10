from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import HistoryPoint, MoverCategory, Quote
from app.services import market_data

router = APIRouter()


@router.get("/quote", response_model=dict[str, Quote])
async def get_quote(symbols: str = Query(..., description="Comma-separated ticker symbols")):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        raise HTTPException(status_code=400, detail="At least one symbol is required.")
    quotes = await market_data.fetch_quotes(symbol_list)
    return {symbol: quote for symbol, quote in quotes.items()}


@router.get("/history/{symbol}", response_model=list[HistoryPoint])
async def get_history(symbol: str, period: str = "1mo", interval: str = "1d"):
    return await market_data.fetch_history(symbol.upper(), period=period, interval=interval)


@router.get("/movers/{category}", response_model=list[Quote])
async def get_movers(category: MoverCategory):
    return await market_data.fetch_movers(category)
