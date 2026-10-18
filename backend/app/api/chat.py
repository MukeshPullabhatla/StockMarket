import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services import chat_service
from app.services.chat_guard import guard_chat_request

router = APIRouter()


@router.post("")
async def chat(body: ChatRequest, request: Request):
    history = guard_chat_request(body, request)

    async def event_stream():
        async for event in chat_service.stream_chat(history):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
