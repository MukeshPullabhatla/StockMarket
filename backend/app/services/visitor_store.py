"""Privacy-friendly unique-visitor counter.

Each visitor is counted at most once per day. A visitor is identified by a
salted SHA-256 hash of (day, IP, user agent); raw IPs are never stored, and
hashes are kept only for the current day before being deleted. What persists
is just one total per day.
"""

import datetime
import hashlib
import re
import secrets

from sqlalchemy import Column, Date, Integer, String, delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.services.watchlist_store import Base, engine

BOT_PATTERN = re.compile(
    r"bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|"
    r"lighthouse|curl|wget|python-requests|httpx|go-http-client|okhttp|java/",
    re.IGNORECASE,
)


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class DailyVisitor(Base):
    __tablename__ = "daily_visitors"

    day = Column(Date, primary_key=True)
    visitor_hash = Column(String, primary_key=True)


class DailyVisitCount(Base):
    __tablename__ = "daily_visit_counts"

    day = Column(Date, primary_key=True)
    count = Column(Integer, nullable=False, default=0)


Base.metadata.create_all(engine)


def _salt() -> str:
    """A random secret generated on first use, so hashes can't be reversed by guessing IPs."""
    with Session(engine) as session:
        setting = session.get(AppSetting, "visitor_salt")
        if setting:
            return setting.value
        session.add(AppSetting(key="visitor_salt", value=secrets.token_hex(32)))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
        return session.get(AppSetting, "visitor_salt").value


def is_bot(user_agent: str) -> bool:
    return not user_agent or bool(BOT_PATTERN.search(user_agent))


def record_visit(ip: str, user_agent: str) -> None:
    """Count this visitor once for today; repeat visits the same day are ignored."""
    today = datetime.datetime.now(datetime.timezone.utc).date()
    visitor_hash = hashlib.sha256(f"{_salt()}|{today}|{ip}|{user_agent}".encode()).hexdigest()

    with Session(engine) as session:
        session.execute(delete(DailyVisitor).where(DailyVisitor.day < today))
        session.add(DailyVisitor(day=today, visitor_hash=visitor_hash))
        try:
            session.flush()
        except IntegrityError:
            session.rollback()
            return
        counter = session.get(DailyVisitCount, today)
        if counter:
            counter.count += 1
        else:
            session.add(DailyVisitCount(day=today, count=1))
        try:
            session.commit()
        except IntegrityError:
            session.rollback()


def total_visitors() -> int:
    with Session(engine) as session:
        return session.scalar(select(func.coalesce(func.sum(DailyVisitCount.count), 0))) or 0
