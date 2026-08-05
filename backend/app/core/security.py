"""
Compatibility shim: redirects old app.core.security imports to the new app.auth module.
This keeps the existing app/api/* routers working without modification.
"""
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    get_current_user,
    require_customer,
    require_shopkeeper,
    require_super_admin,
)

# Backward-compat alias used by old routers
def require_role(allowed_roles: list):
    """Compatibility wrapper for the old require_role(["shopkeeper"]) pattern."""
    from fastapi import Depends, HTTPException, status

    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
