from fastapi import APIRouter, Request

from app.models.schemas import VisitorCount
from app.services import visitor_store
from app.services.request_utils import client_ip

router = APIRouter()


@router.get("", response_model=VisitorCount)
async def get_visitor_count():
    return VisitorCount(total=visitor_store.total_visitors())


@router.post("", response_model=VisitorCount)
async def record_visit(request: Request):
    user_agent = request.headers.get("user-agent", "")
    if not visitor_store.is_bot(user_agent):
        visitor_store.record_visit(client_ip(request), user_agent)
    return VisitorCount(total=visitor_store.total_visitors())
