import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services import chat_service

router = APIRouter()


@router.post("")
async def chat(request: ChatRequest):
    async def event_stream():
        async for event in chat_service.stream_chat(request.messages):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
