"""
Compatibility shim: redirects app.core.database imports to the new app.database module.
"""
from app.database import Database, get_db

__all__ = ["Database", "get_db"]
