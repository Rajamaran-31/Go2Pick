from typing import Optional
from app.config import get_settings

def resolve_static_url(url: Optional[str]) -> str:
    """Resolve relative static URL path to absolute URL using BACKEND_URL."""
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("/static/"):
        settings = get_settings()
        backend_url = getattr(settings, "BACKEND_URL", "http://localhost:8000")
        return f"{backend_url.rstrip('/')}{url}"
    return url
