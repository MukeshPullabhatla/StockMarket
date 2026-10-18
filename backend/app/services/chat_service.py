import json
import logging
from collections.abc import AsyncGenerator

from groq import APIStatusError, AsyncGroq

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.models.schemas import ChatMessage
from app.services import market_data

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5

SYSTEM_PROMPT = (
    "You are a stock market assistant embedded in a live trading dashboard. "
    "You do not know current prices from training data - they are always out of date. "
    "Before stating any price, change, or trend for a specific stock, you MUST call one of "
    "the provided tools to fetch live data. Cite the numbers the tools return; do not guess. "
    "Keep answers concise and focused on what the user asked."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_quote",
            "description": "Get the current live price and change for one or more stock ticker symbols.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbols": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Ticker symbols, e.g. ['AAPL', 'MSFT'].",
                    }
                },
                "required": ["symbols"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_history_summary",
            "description": "Get recent historical closing prices for a single ticker symbol, to describe its trend.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "A single ticker symbol, e.g. 'AAPL'."},
                    "period": {
                        "type": "string",
                        "description": "History window, e.g. '5d', '1mo', '6mo', '1y'. Defaults to '1mo'.",
                    },
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_movers",
            "description": "Get the current top market-wide movers for a category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": ["gainers", "losers", "most_active"],
                    }
                },
                "required": ["category"],
            },
        },
    },
]


async def _execute_tool(name: str, tool_input: dict) -> str:
    try:
        if name == "get_quote":
            symbols = [s.upper() for s in tool_input.get("symbols", [])]
            quotes = await market_data.fetch_quotes(symbols)
            return json.dumps({s: q.model_dump() for s, q in quotes.items()})
        if name == "get_history_summary":
            symbol = tool_input["symbol"].upper()
            period = tool_input.get("period", "1mo")
            points = await market_data.fetch_history(symbol, period=period)
            return json.dumps([p.model_dump() for p in points[-30:]])
        if name == "get_movers":
            movers = await market_data.fetch_movers(tool_input["category"], count=10)
            return json.dumps([m.model_dump() for m in movers])
        return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as exc:
        logger.exception("Tool execution failed: %s", name)
        return json.dumps({"error": str(exc)})


def _to_api_messages(messages: list[ChatMessage]) -> list[dict]:
    return [{"role": "system", "content": SYSTEM_PROMPT}] + [
        {"role": m.role, "content": m.content} for m in messages
    ]


async def stream_chat(messages: list[ChatMessage]) -> AsyncGenerator[dict, None]:
    if not GROQ_API_KEY:
        yield {"type": "error", "error": "GROQ_API_KEY is not configured on the server."}
        return

    client = AsyncGroq(api_key=GROQ_API_KEY)
    api_messages = _to_api_messages(messages)

    for _ in range(MAX_TOOL_ROUNDS):
        content = ""
        # Streamed tool calls arrive in fragments keyed by index; reassemble them.
        tool_calls: dict[int, dict] = {}
        finish_reason = None
        try:
            stream = await client.chat.completions.create(
                model=GROQ_MODEL,
                max_tokens=2048,
                messages=api_messages,
                tools=TOOLS,
                stream=True,
            )
            async for chunk in stream:
                if not chunk.choices:
                    continue
                choice = chunk.choices[0]
                delta = choice.delta
                if delta.content:
                    content += delta.content
                    yield {"type": "text", "text": delta.content}
                for tc in delta.tool_calls or []:
                    call = tool_calls.setdefault(tc.index, {"id": "", "name": "", "arguments": ""})
                    if tc.id:
                        call["id"] = tc.id
                    if tc.function and tc.function.name:
                        call["name"] = tc.function.name
                    if tc.function and tc.function.arguments:
                        call["arguments"] += tc.function.arguments
                if choice.finish_reason:
                    finish_reason = choice.finish_reason
        except APIStatusError as exc:
            yield {"type": "error", "error": f"Groq API error: {exc.message}"}
            return
        except Exception as exc:
            logger.exception("Chat completion failed")
            yield {"type": "error", "error": str(exc)}
            return

        if finish_reason != "tool_calls" or not tool_calls:
            break

        calls = [tool_calls[i] for i in sorted(tool_calls)]
        api_messages.append(
            {
                "role": "assistant",
                "content": content or None,
                "tool_calls": [
                    {
                        "id": call["id"],
                        "type": "function",
                        "function": {"name": call["name"], "arguments": call["arguments"]},
                    }
                    for call in calls
                ],
            }
        )
        for call in calls:
            try:
                tool_input = json.loads(call["arguments"] or "{}")
            except json.JSONDecodeError:
                tool_input = {}
            yield {"type": "tool", "name": call["name"], "input": tool_input}
            result = await _execute_tool(call["name"], tool_input)
            api_messages.append({"role": "tool", "tool_call_id": call["id"], "content": result})
    else:
        yield {"type": "error", "error": "Stopped after too many tool call rounds."}
        return

    yield {"type": "done"}
