from datetime import datetime, timezone
from typing import Optional

# Global in-memory store to guarantee resilient operation even under database quota limits
APPLICATIONS_STORE = {}

def add_application(app_dict: dict):
    app_id = app_dict.get("id") or f"app-{len(APPLICATIONS_STORE) + 1}"
    app_dict["id"] = app_id
    APPLICATIONS_STORE[app_id] = app_dict
    return app_dict

def get_all_applications(status: Optional[str] = None):
    apps = list(APPLICATIONS_STORE.values())
    if status:
        apps = [a for a in apps if a.get("status") == status]
    return apps

def update_application_status(app_id: str, new_status: str, rejection_reason: Optional[str] = None):
    if app_id in APPLICATIONS_STORE:
        APPLICATIONS_STORE[app_id]["status"] = new_status
        if rejection_reason:
            APPLICATIONS_STORE[app_id]["rejectionReason"] = rejection_reason
        APPLICATIONS_STORE[app_id]["reviewedAt"] = datetime.now(timezone.utc).isoformat()
        return APPLICATIONS_STORE[app_id]
    return None
