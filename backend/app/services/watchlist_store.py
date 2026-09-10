import datetime
import os

from sqlalchemy import Column, DateTime, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Session

from app.config import DB_PATH


class Base(DeclarativeBase):
    pass


class WatchlistEntry(Base):
    __tablename__ = "watchlist"

    symbol = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)


os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)


def list_watchlist() -> list[WatchlistEntry]:
    with Session(engine) as session:
        return list(session.scalars(select(WatchlistEntry).order_by(WatchlistEntry.added_at)))


def add_symbol(symbol: str, name: str | None) -> WatchlistEntry:
    symbol = symbol.upper()
    with Session(engine) as session:
        existing = session.get(WatchlistEntry, symbol)
        if existing:
            return existing
        entry = WatchlistEntry(symbol=symbol, name=name)
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return entry


def remove_symbol(symbol: str) -> bool:
    symbol = symbol.upper()
    with Session(engine) as session:
        entry = session.get(WatchlistEntry, symbol)
        if not entry:
            return False
        session.delete(entry)
        session.commit()
        return True


def symbols() -> list[str]:
    with Session(engine) as session:
        return list(session.scalars(select(WatchlistEntry.symbol)))
