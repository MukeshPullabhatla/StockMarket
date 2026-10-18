from typing import Literal

from pydantic import BaseModel, Field


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
    content: str = Field(max_length=20_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(max_length=200)


class VisitorCount(BaseModel):
    total: int


class SymbolInfo(BaseModel):
    symbol: str
    name: str | None = None
