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
