from typing import Literal

from pydantic import BaseModel


class Quote(BaseModel):
    symbol: str
    name: str | None = None
    price: float | None = None
    previous_close: float | None = None
    change: float | None = None
    change_percent: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    volume: float | None = None
    currency: str | None = None


class HistoryPoint(BaseModel):
    date: str
    close: float


class WatchlistItem(BaseModel):
    symbol: str
    name: str | None = None
    added_at: str


class WatchlistAddRequest(BaseModel):
    symbol: str


MoverCategory = Literal["gainers", "losers", "most_active"]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
