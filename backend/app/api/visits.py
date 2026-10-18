from fastapi import APIRouter, Request

from app.models.schemas import VisitorCount
from app.services import visitor_store

router = APIRouter()


def _client_ip(request: Request) -> str:
    # Behind Caddy -> nginx, the real client IP arrives in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "")


@router.get("", response_model=VisitorCount)
async def get_visitor_count():
    return VisitorCount(total=visitor_store.total_visitors())


@router.post("", response_model=VisitorCount)
async def record_visit(request: Request):
    user_agent = request.headers.get("user-agent", "")
    if not visitor_store.is_bot(user_agent):
        visitor_store.record_visit(_client_ip(request), user_agent)
    return VisitorCount(total=visitor_store.total_visitors())
