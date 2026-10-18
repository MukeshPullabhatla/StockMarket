"""In-memory sliding-window limits for the AI chat, to protect the Groq quota.

Counts reset if the backend restarts, which is fine for a single small server.
"""

import time
from collections import deque
from dataclasses import dataclass

HOUR = 3600
DAY = 86400


@dataclass
class Blocked:
    retry_after: int  # seconds until the next request would be allowed
    site_wide: bool  # True when the whole site hit its daily cap


class ChatRateLimiter:
    def __init__(self, per_hour: int, per_day: int, global_per_day: int) -> None:
        self.per_hour = per_hour
        self.per_day = per_day
        self.global_per_day = global_per_day
        self._visitors: dict[str, deque[float]] = {}
        self._global: deque[float] = deque()

    def check(self, visitor: str) -> Blocked | None:
        """Record one request for `visitor`, or return why it's blocked."""
        now = time.monotonic()
        hits = self._visitors.setdefault(visitor, deque())
        _drop_older_than(hits, now - DAY)
        _drop_older_than(self._global, now - DAY)

        if len(self._global) >= self.global_per_day:
            return Blocked(_seconds_until(self._global[0] + DAY, now), site_wide=True)
        if len(hits) >= self.per_day:
            return Blocked(_seconds_until(hits[0] + DAY, now), site_wide=False)
        last_hour = [t for t in hits if t > now - HOUR]
        if len(last_hour) >= self.per_hour:
            return Blocked(_seconds_until(last_hour[0] + HOUR, now), site_wide=False)

        hits.append(now)
        self._global.append(now)
        if len(self._visitors) > 10_000:
            self._forget_idle(now)
        return None

    def _forget_idle(self, now: float) -> None:
        for key in [k for k, v in self._visitors.items() if not v or v[-1] < now - DAY]:
            del self._visitors[key]


def _drop_older_than(hits: deque[float], cutoff: float) -> None:
    while hits and hits[0] <= cutoff:
        hits.popleft()


def _seconds_until(moment: float, now: float) -> int:
    return max(1, int(moment - now) + 1)
