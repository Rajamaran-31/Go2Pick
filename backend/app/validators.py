import re


def is_valid_phone(phone: str) -> bool:
    return bool(re.match(r"^\+?[0-9]{7,15}$", phone))


def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email))


def is_strong_password(password: str) -> bool:
    return (
        len(password) >= 8
        and bool(re.search(r"[A-Z]", password))
        and bool(re.search(r"[0-9]", password))
    )


def is_valid_pincode(pincode: str) -> bool:
    return bool(re.match(r"^\d{4,10}$", pincode))
