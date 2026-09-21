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
        is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
        if is_vercel and ("localhost" in backend_url or not backend_url):
            backend_url = "https://go2pick-backend.vercel.app"
        return f"{backend_url.rstrip('/')}{url}"
    return url
