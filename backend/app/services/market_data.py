import asyncio
import logging
import math
import time
from collections.abc import Awaitable, Callable
from typing import Any

import yfinance as yf

from app.config import MOVER_CATEGORIES
from app.models.schemas import HistoryPoint, Quote

logger = logging.getLogger(__name__)

# Short-lived caches shared by all visitors, so traffic spikes don't hammer
# Yahoo Finance (which throttles heavy callers). Values: (expires_at, value).
QUOTE_TTL = 15
MOVERS_TTL = 60
HISTORY_TTL = 300
NAME_TTL = 86400
MAX_CACHE_ENTRIES = 2000

_cache: dict[tuple, tuple[float, Any]] = {}
_in_flight: dict[tuple, asyncio.Future] = {}


def _cache_get(key: tuple) -> tuple[bool, Any]:
    entry = _cache.get(key)
    if entry and entry[0] > time.monotonic():
        return True, entry[1]
    return False, None


def _cache_set(key: tuple, value: Any, ttl: float) -> None:
    if len(_cache) >= MAX_CACHE_ENTRIES:
        now = time.monotonic()
        for stale in [k for k, (expires, _) in _cache.items() if expires <= now]:
            del _cache[stale]
        if len(_cache) >= MAX_CACHE_ENTRIES:
            _cache.clear()
    _cache[key] = (time.monotonic() + ttl, value)


async def _cached(key: tuple, ttl: float, fetch: Callable[[], Awaitable[Any]]) -> Any:
    """Return a cached value, or fetch it once even if many requests ask at the same time."""
    hit, value = _cache_get(key)
    if hit:
        return value
    task = _in_flight.get(key)
    if task is None:
        task = asyncio.ensure_future(fetch())
        _in_flight[key] = task

        def _done(t: asyncio.Future) -> None:
            _in_flight.pop(key, None)
            if not t.cancelled() and t.exception() is None:
                _cache_set(key, t.result(), ttl)

        task.add_done_callback(_done)
    return await asyncio.shield(task)



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
    # Cached per symbol, so overlapping requests only fetch what's missing.
    found: dict[str, Quote] = {}
    missing: list[str] = []
    for symbol in symbols:
        hit, quote = _cache_get(("quote", symbol))
        if hit:
            found[symbol] = quote
        else:
            missing.append(symbol)
    if missing:
        fresh = await asyncio.to_thread(_fetch_quotes_sync, missing)
        for symbol, quote in fresh.items():
            _cache_set(("quote", symbol), quote, QUOTE_TTL)
        found.update(fresh)
    return {symbol: found[symbol] for symbol in symbols if symbol in found}


async def fetch_symbol_name(symbol: str) -> str | None:
    return await _cached(
        ("name", symbol), NAME_TTL, lambda: asyncio.to_thread(_fetch_name_sync, symbol)
    )


async def fetch_history(symbol: str, period: str = "1mo", interval: str = "1d") -> list[HistoryPoint]:
    return await _cached(
        ("history", symbol, period, interval),
        HISTORY_TTL,
        lambda: asyncio.to_thread(_fetch_history_sync, symbol, period, interval),
    )


async def fetch_movers(category: str, count: int = 25) -> list[Quote]:
    if category not in MOVER_CATEGORIES:
        raise ValueError(f"Unknown mover category: {category}")
    return await _cached(
        ("movers", category, count),
        MOVERS_TTL,
        lambda: asyncio.to_thread(_fetch_movers_sync, category, count),
    )


async def symbol_exists(symbol: str) -> bool:
    quotes = await fetch_quotes([symbol])
    quote = quotes.get(symbol)
    return quote is not None and quote.price is not None
