import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, stocks, watchlist, ws
from app.config import CORS_ORIGINS
from app.services import broadcaster

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    broadcaster.start_poll_loop()
    yield
    broadcaster.stop_poll_loop()


app = FastAPI(title="Stock Trend Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router, prefix="/api", tags=["stocks"])
app.include_router(watchlist.router, prefix="/api/watchlist", tags=["watchlist"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(ws.router, prefix="/ws", tags=["websocket"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
