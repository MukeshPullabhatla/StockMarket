import asyncio
import logging
import math

import yfinance as yf

from app.config import MOVER_CATEGORIES
from app.models.schemas import HistoryPoint, Quote

logger = logging.getLogger(__name__)


def _clean(value: float | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    return float(value)


def _quote_from_fast_info(symbol: str, fast_info) -> Quote:
    price = _clean(fast_info.get("lastPrice"))
    previous_close = _clean(fast_info.get("previousClose"))
    change = None
    change_percent = None
    if price is not None and previous_close:
        change = price - previous_close
        change_percent = (change / previous_close) * 100
    return Quote(
        symbol=symbol,
        price=price,
        previous_close=previous_close,
        change=change,
        change_percent=change_percent,
        day_high=_clean(fast_info.get("dayHigh")),
        day_low=_clean(fast_info.get("dayLow")),
        volume=_clean(fast_info.get("lastVolume")),
        currency=fast_info.get("currency"),
    )


def _fetch_quotes_sync(symbols: list[str]) -> dict[str, Quote]:
    if not symbols:
        return {}
    tickers = yf.Tickers(" ".join(symbols))
    results: dict[str, Quote] = {}
    for symbol, ticker in tickers.tickers.items():
        try:
            results[symbol] = _quote_from_fast_info(symbol, ticker.fast_info)
        except Exception:
            logger.warning("Failed to fetch quote for %s", symbol, exc_info=True)
    return results


def _fetch_name_sync(symbol: str) -> str | None:
    try:
        info = yf.Ticker(symbol).get_info()
        return info.get("shortName") or info.get("longName")
    except Exception:
        logger.warning("Failed to fetch name for %s", symbol, exc_info=True)
        return None


def _fetch_history_sync(symbol: str, period: str, interval: str) -> list[HistoryPoint]:
    df = yf.Ticker(symbol).history(period=period, interval=interval)
    df = df.dropna(subset=["Close"])
    return [
        HistoryPoint(date=index.strftime("%Y-%m-%d %H:%M"), close=round(float(row["Close"]), 4))
        for index, row in df.iterrows()
    ]


def _fetch_movers_sync(category: str, count: int) -> list[Quote]:
    query = MOVER_CATEGORIES[category]
    result = yf.screen(query, count=count)
    quotes = []
    for entry in result.get("quotes", []):
        price = _clean(entry.get("regularMarketPrice"))
        change = _clean(entry.get("regularMarketChange"))
        change_percent = _clean(entry.get("regularMarketChangePercent"))
        quotes.append(
            Quote(
                symbol=entry.get("symbol", ""),
                name=entry.get("shortName"),
                price=price,
                previous_close=(price - change) if price is not None and change is not None else None,
                change=change,
                change_percent=change_percent,
                volume=_clean(entry.get("regularMarketVolume")),
                currency=entry.get("currency"),
            )
        )
    return quotes


async def fetch_quotes(symbols: list[str]) -> dict[str, Quote]:
    return await asyncio.to_thread(_fetch_quotes_sync, symbols)


async def fetch_symbol_name(symbol: str) -> str | None:
    return await asyncio.to_thread(_fetch_name_sync, symbol)


async def fetch_history(symbol: str, period: str = "1mo", interval: str = "1d") -> list[HistoryPoint]:
    return await asyncio.to_thread(_fetch_history_sync, symbol, period, interval)


async def fetch_movers(category: str, count: int = 25) -> list[Quote]:
    if category not in MOVER_CATEGORIES:
        raise ValueError(f"Unknown mover category: {category}")
    return await asyncio.to_thread(_fetch_movers_sync, category, count)


async def symbol_exists(symbol: str) -> bool:
    quotes = await fetch_quotes([symbol])
    quote = quotes.get(symbol)
    return quote is not None and quote.price is not None
