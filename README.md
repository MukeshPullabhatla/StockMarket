# Stock Trend Dashboard

A live stock market dashboard with a built-in AI assistant. It tracks watchlisted
tickers and market movers in real time, and lets you ask a chatbot questions
about the market in plain English — the assistant fetches live data itself
before it answers, instead of relying on stale training knowledge.

## What it does

- **Live quotes & charts** — price, change, day high/low, and volume for any
  ticker, plus historical close-price history for trend charts.
- **Market movers** — top gainers, losers, and most-active stocks.
- **Watchlist** — add/remove symbols, persisted server-side.
- **Real-time updates** — a WebSocket connection pushes fresh quotes to the
  browser on a poll interval, so prices update without refreshing.
- **AI chat assistant** — ask things like *"how is AAPL doing today?"* or
  *"what are the top movers?"* and get an answer grounded in current data.

## Architecture

```
frontend/  React + TypeScript (Vite), recharts for charts
backend/   FastAPI (Python), yfinance for market data, SQLite-backed watchlist
```

- `backend/app/api/stocks.py` — REST endpoints for quotes, history, and movers.
- `backend/app/api/watchlist.py` — CRUD endpoints for the watchlist.
- `backend/app/api/ws.py` + `services/broadcaster.py` — WebSocket price feed;
  a background poll loop periodically re-fetches quotes for watched/mover
  symbols and broadcasts them to connected clients.
- `backend/app/services/market_data.py` — wraps `yfinance` for quotes,
  history, and screener-based movers.
- `backend/app/api/chat.py` + `services/chat_service.py` — the AI chat
  endpoint (see below).
- `frontend/src/components/` — `Dashboard`, `Watchlist`, `MarketMovers`,
  `StockChart`, and `ChatPanel`.

## How the LLM/AI integration works

The chat assistant lives in [backend/app/services/chat_service.py](backend/app/services/chat_service.py) and is
powered by an LLM through the **Groq API** (`AsyncGroq`, model configured via
`GROQ_MODEL`, e.g. `openai/gpt-oss-120b`).

The key design point: **the model is not trusted to know current prices**.
Its system prompt explicitly tells it that any price/trend data from training
is stale, and that it must call a tool to fetch live numbers before answering.
This is the same tool-calling ("function calling") pattern used by most
LLM-powered agents:

1. The frontend (`ChatPanel.tsx`) sends the full conversation to
   `POST /api/chat`.
2. The backend calls the Groq chat-completions API with three tool
   definitions the model can invoke:
   - `get_quote(symbols)` — live price/change for one or more tickers.
   - `get_history_summary(symbol, period)` — recent closing prices for a
     trend description.
   - `get_movers(category)` — current top gainers/losers/most-active.
3. If the model decides it needs data, it returns a `tool_calls` response
   instead of text. The backend executes the requested tool(s) against
   `services/market_data.py` (which hits `yfinance`), feeds the results back
   into the conversation as `tool` messages, and asks the model again — up
   to `MAX_TOOL_ROUNDS` (5) rounds.
4. Once the model has what it needs, it streams a plain-text answer back to
   the client over Server-Sent Events (`text/event-stream`), along with
   `tool` events (so the UI can show "Looking up quote…") and a final `done`
   event.

So the LLM acts as a reasoning/orchestration layer on top of the app's own
market-data service — it decides *which* data it needs and *when*, but every
number it cites comes from a live tool call, not from the model itself.

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Configuration

Copy `.env.example` to `.env` and set:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key for Groq (required for the chat assistant to work). |
| `GROQ_MODEL` | Groq model id to use (default: `openai/gpt-oss-120b`). |
| `POLL_INTERVAL_SECONDS` | How often the backend polls live prices for the WebSocket feed. |

Without `GROQ_API_KEY`, the rest of the dashboard (quotes, charts, watchlist,
movers) still works — only the chat assistant is disabled.

### Docker

```bash
docker compose up --build
```

Runs the backend and frontend (served via nginx) together, using `.env` for
backend configuration.
