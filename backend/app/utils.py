from typing import Optional
from app.config import get_settings

def to_object_id(id_str) -> str:
    """
    Compatibility shim: returns plain string ID to support Firestore document IDs,
    minimizing diffs in router endpoints.
    """
    return str(id_str)


def resolve_static_url(url: Optional[str]) -> str:
    """Resolve relative static URL path to absolute URL using BACKEND_URL."""
    if not url:
        return ""
    url_str = url.strip()
    if not url_str:
        return ""
    if url_str.startswith("http://") or url_str.startswith("https://") or url_str.startswith("data:"):
        return url_str
    
    settings = get_settings()
    backend_url = getattr(settings, "BACKEND_URL", "http://localhost:8000").rstrip('/')
    
    if url_str.startswith("/"):
        return f"{backend_url}{url_str}"
    else:
        return f"{backend_url}/{url_str}"


