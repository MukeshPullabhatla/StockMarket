"""Speech-to-text via Groq's hosted Whisper model."""

import logging

from groq import APIStatusError, AsyncGroq

from app.config import GROQ_API_KEY, GROQ_STT_MODEL

logger = logging.getLogger(__name__)

# Browsers record in different containers; Whisper needs a matching file extension.
EXTENSIONS = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/aac": "m4a",
    "audio/x-m4a": "m4a",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mpeg": "mp3",
}


# Vocabulary hint so Whisper spells names and terms visitors are likely to say correctly.
VOCABULARY_PROMPT = (
    "Questions about Mukesh Kumar Pullabhatla (Mukesh KP), an AI engineer at UWM "
    "(United Wholesale Mortgage). Topics: ChatUWM, GenAI, LLMs, RAG, MCP, Vertex AI, "
    "Azure OpenAI, OpenAI, Gemini, Claude, Pipecat, Deepgram, ElevenLabs, Rocket Companies, "
    "the Stock Trend Dashboard."
)


class TranscriptionError(Exception):
    pass


def extension_for(content_type: str) -> str | None:
    return EXTENSIONS.get(content_type.split(";")[0].strip().lower())


async def transcribe(audio: bytes, content_type: str) -> str:
    ext = extension_for(content_type)
    if not ext:
        raise TranscriptionError(f"Unsupported audio type: {content_type}")
    if not GROQ_API_KEY:
        raise TranscriptionError("Voice input isn't configured on the server yet.")

    client = AsyncGroq(api_key=GROQ_API_KEY)
    try:
        result = await client.audio.transcriptions.create(
            file=(f"speech.{ext}", audio, content_type.split(";")[0].strip()),
            model=GROQ_STT_MODEL,
            language="en",
            prompt=VOCABULARY_PROMPT,
            response_format="verbose_json",
            temperature=0.0,
        )
    except APIStatusError as exc:
        logger.warning("Transcription failed: %s", exc.message)
        raise TranscriptionError("The speech service couldn't process that audio.") from exc
    return _speech_only(result)


# Whisper invents short phrases ("Thank you.", "Bye.") for silent or noisy audio. Drop
# segments the model is unsure about. Groq always reports no_speech_prob=0, so average token
# confidence is the useful signal: real questions measured around -0.2 to -0.3, invented
# text around -1.0 to -1.2 (with the vocabulary prompt), so -0.7 sits safely between.
NO_SPEECH_THRESHOLD = 0.6
MIN_AVG_LOGPROB = -0.7


def _speech_only(result) -> str:
    segments = getattr(result, "segments", None)
    if segments is None and getattr(result, "model_extra", None):
        segments = result.model_extra.get("segments")
    if not segments:
        text = (getattr(result, "text", "") or "").strip()
    else:
        kept = []
        for seg in segments:
            get = seg.get if isinstance(seg, dict) else lambda k, d=None, _s=seg: getattr(_s, k, d)
            unsure = (get("avg_logprob", 0.0) or 0.0) < MIN_AVG_LOGPROB
            silent = (get("no_speech_prob", 0.0) or 0.0) >= NO_SPEECH_THRESHOLD
            if not unsure and not silent:
                kept.append((get("text", "") or "").strip())
        text = " ".join(t for t in kept if t).strip()
    # Punctuation-only output (e.g. ".") means nothing was said.
    return text if any(ch.isalpha() for ch in text) else ""
