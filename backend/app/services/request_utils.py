from fastapi import Request


def client_ip(request: Request) -> str:
    """The visitor's IP. Behind Caddy -> nginx it arrives in X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "")
