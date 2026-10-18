import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.config import (
    CHAT_LIMIT_PER_DAY,
    CHAT_LIMIT_PER_HOUR,
    CHAT_LIMIT_SITE_PER_DAY,
    CHAT_MAX_HISTORY_MESSAGES,
    CHAT_MAX_MESSAGE_CHARS,
)
from app.models.schemas import ChatRequest
from app.services import chat_service
from app.services.rate_limit import ChatRateLimiter
from app.services.request_utils import client_ip

router = APIRouter()

limiter = ChatRateLimiter(
    per_hour=CHAT_LIMIT_PER_HOUR,
    per_day=CHAT_LIMIT_PER_DAY,
    global_per_day=CHAT_LIMIT_SITE_PER_DAY,
)


def _describe_wait(seconds: int) -> str:
    minutes = max(1, round(seconds / 60))
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = round(minutes / 60)
    return f"{hours} hour{'s' if hours != 1 else ''}"


@router.post("")
async def chat(body: ChatRequest, request: Request):
    messages = body.messages
    if not messages or messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="The last message must be from the user.")
    if len(messages[-1].content) > CHAT_MAX_MESSAGE_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Message is too long — please keep it under {CHAT_MAX_MESSAGE_CHARS:,} characters.",
        )

    blocked = limiter.check(client_ip(request))
    if blocked:
        wait = _describe_wait(blocked.retry_after)
        detail = (
            f"The assistant has reached its daily limit for the whole site. Please try again in {wait}."
            if blocked.site_wide
            else f"You've reached the chat limit for now — try again in {wait}."
        )
        raise HTTPException(status_code=429, detail=detail, headers={"Retry-After": str(blocked.retry_after)})

    history = messages[-CHAT_MAX_HISTORY_MESSAGES:]

    async def event_stream():
        async for event in chat_service.stream_chat(history):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
