import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from app.database import get_db


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _delete_doc(db, doc):
    try:
        if getattr(doc, "reference", None) is not None:
            doc.reference.delete()
        elif getattr(doc, "id", None):
            db.collection("otps").document(str(doc.id)).delete()
    except Exception as e:
        print(f"[WARN] Failed to delete OTP doc {getattr(doc, 'id', '')}: {e}")


async def create_otp(email: str, otp_type: str) -> str:
    db = get_db()
    otp = generate_otp()

    # Delete previous OTPs of same type
    docs = list(db.collection("otps").where("email", "==", email.lower()).where("type", "==", otp_type).stream())
    for doc in docs:
        _delete_doc(db, doc)

    # Insert new OTP
    db.collection("otps").add({
        "email": email.lower(),
        "otp": otp,
        "type": otp_type,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=10),
        "createdAt": datetime.now(timezone.utc),
    })
    return otp


async def verify_otp(email: str, otp: str, otp_type: str, consume: bool = True) -> bool:
    db = get_db()
    docs = list(db.collection("otps")
                .where("email", "==", email.lower())
                .where("otp", "==", otp)
                .where("type", "==", otp_type)
                .stream())

    if not docs:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")

    record = docs[0].to_dict()
    expires_at = record.get("expiresAt")
    
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            except Exception:
                expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        if getattr(expires_at, "tzinfo", None) is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            _delete_doc(db, docs[0])
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # Consume (delete) OTP if requested
    if consume:
        _delete_doc(db, docs[0])

    return True


