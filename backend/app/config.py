import os

from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "20"))
DB_PATH = os.getenv("DB_PATH", "/data/app.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

MOVER_CATEGORIES = {
    "gainers": "day_gainers",
    "losers": "day_losers",
    "most_active": "most_actives",
}

# AI chat abuse limits (per visitor IP, and for the whole site)
CHAT_LIMIT_PER_HOUR = int(os.getenv("CHAT_LIMIT_PER_HOUR", "15"))
CHAT_LIMIT_PER_DAY = int(os.getenv("CHAT_LIMIT_PER_DAY", "50"))
CHAT_LIMIT_SITE_PER_DAY = int(os.getenv("CHAT_LIMIT_SITE_PER_DAY", "500"))
CHAT_MAX_MESSAGE_CHARS = 1000
CHAT_MAX_HISTORY_MESSAGES = 20

# Secret required to change the shared (default) watchlist; empty disables edits.
ADMIN_KEY = os.getenv("ADMIN_KEY", "")
