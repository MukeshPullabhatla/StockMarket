"""Validation and rate limits shared by every AI chat endpoint on the site."""

from fastapi import HTTPException, Request

from app.config import (
    CHAT_LIMIT_PER_DAY,
    CHAT_LIMIT_PER_HOUR,
    CHAT_LIMIT_SITE_PER_DAY,
    CHAT_MAX_HISTORY_MESSAGES,
    CHAT_MAX_MESSAGE_CHARS,
)
from app.models.schemas import ChatMessage, ChatRequest
from app.services.rate_limit import ChatRateLimiter
from app.services.request_utils import client_ip

# One limiter for all chats, so the site-wide cap protects the whole Groq quota.
limiter = ChatRateLimiter(
    per_hour=CHAT_LIMIT_PER_HOUR,
    per_day=CHAT_LIMIT_PER_DAY,
    global_per_day=CHAT_LIMIT_SITE_PER_DAY,
)


def describe_wait(seconds: int) -> str:
    minutes = max(1, round(seconds / 60))
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = round(minutes / 60)
    return f"{hours} hour{'s' if hours != 1 else ''}"


def guard_chat_request(body: ChatRequest, request: Request) -> list[ChatMessage]:
    """Reject invalid or over-limit requests; return the history to send to the model."""
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
        wait = describe_wait(blocked.retry_after)
        detail = (
            f"The assistant has reached its daily limit for the whole site. Please try again in {wait}."
            if blocked.site_wide
            else f"You've reached the chat limit for now — try again in {wait}."
        )
        raise HTTPException(status_code=429, detail=detail, headers={"Retry-After": str(blocked.retry_after)})

    return messages[-CHAT_MAX_HISTORY_MESSAGES:]
