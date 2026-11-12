import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import SmartWriteRequest
from app.services import smart_write_service
from app.services.chat_guard import enforce_ai_limit

router = APIRouter()


@router.post("")
async def smart_write(body: SmartWriteRequest, request: Request):
    """Stream a rewritten version of the visitor's draft (Server-Sent Events)."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Please enter some text to rewrite.")
    enforce_ai_limit(request)

    async def event_stream():
        async for event in smart_write_service.stream_rewrite(body):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
