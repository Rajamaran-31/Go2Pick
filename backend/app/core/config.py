"""
Compatibility shim: redirects app.core.config imports to the new app.config module.
"""
from app.config import Settings, get_settings

__all__ = ["Settings", "get_settings"]
