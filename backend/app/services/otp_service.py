import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from app.database import get_db


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def create_otp(email: str, otp_type: str) -> str:
    db = get_db()
    otp = generate_otp()

    # Delete previous OTPs of same type
    docs = db.collection("otps").where("email", "==", email.lower()).where("type", "==", otp_type).stream()
    for doc in docs:
        doc.reference.delete()

    # Insert new OTP
    db.collection("otps").add({
        "email": email.lower(),
        "otp": otp,
        "type": otp_type,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=10),
        "createdAt": datetime.now(timezone.utc),
    })
    return otp


async def verify_otp(email: str, otp: str, otp_type: str) -> bool:
    db = get_db()
    docs = list(db.collection("otps")
                .where("email", "==", email.lower())
                .where("otp", "==", otp)
                .where("type", "==", otp_type)
                .stream())

    if not docs:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    record = docs[0].to_dict()
    expires_at = record["expiresAt"]
    
    # Firestore returns timezone-aware timestamps (datetime objects)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        docs[0].reference.delete()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # Consume (delete) OTP
    docs[0].reference.delete()
    return True
