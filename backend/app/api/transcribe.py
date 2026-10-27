from fastapi import APIRouter, HTTPException, Request

from app.config import (
    TRANSCRIBE_LIMIT_PER_DAY,
    TRANSCRIBE_LIMIT_PER_HOUR,
    TRANSCRIBE_LIMIT_SITE_PER_DAY,
    TRANSCRIBE_MAX_BYTES,
)
from app.models.schemas import Transcription
from app.services import transcribe_service
from app.services.chat_guard import describe_wait
from app.services.rate_limit import ChatRateLimiter
from app.services.request_utils import client_ip

router = APIRouter()

limiter = ChatRateLimiter(
    per_hour=TRANSCRIBE_LIMIT_PER_HOUR,
    per_day=TRANSCRIBE_LIMIT_PER_DAY,
    global_per_day=TRANSCRIBE_LIMIT_SITE_PER_DAY,
)


@router.post("", response_model=Transcription)
async def transcribe(request: Request):
    """Transcribe a short voice question. Body: raw audio bytes with an audio/* Content-Type."""
    content_type = request.headers.get("content-type", "")
    if not transcribe_service.extension_for(content_type):
        raise HTTPException(status_code=415, detail="Unsupported audio format.")

    audio = await request.body()
    if not audio:
        raise HTTPException(status_code=400, detail="No audio received.")
    if len(audio) > TRANSCRIBE_MAX_BYTES:
        raise HTTPException(status_code=413, detail="That recording is too long — please keep it under 30 seconds.")

    blocked = limiter.check(client_ip(request))
    if blocked:
        raise HTTPException(
            status_code=429,
            detail=f"You've reached the voice limit for now — try again in {describe_wait(blocked.retry_after)}.",
            headers={"Retry-After": str(blocked.retry_after)},
        )

    try:
        text = await transcribe_service.transcribe(audio, content_type)
    except transcribe_service.TranscriptionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return Transcription(text=text)
