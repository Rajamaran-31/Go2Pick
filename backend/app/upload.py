import os
import uuid
import shutil
from typing import Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = Path("static/uploads")
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
    "image/pjpeg", "image/x-png", "image/bmp", "image/svg+xml",
    "application/octet-stream"
}
ALLOWED_IMPORT_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MAX_FILE_SIZE_MB = 10


def _save_local(file: UploadFile, subfolder: str) -> str:
    """Save file locally and return its URL path (fallback to base64 data URL on serverless)."""
    import base64
    ext = Path(file.filename or "file").suffix.lower()
    filename = f"{uuid.uuid4().hex}{ext}"

    # On Vercel / serverless, return data URL directly so image is permanent and never 404s
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    if is_serverless:
        try:
            file.file.seek(0)
            content = file.file.read()
            if content and len(content) <= 5 * 1024 * 1024:
                mime = file.content_type if file.content_type and "image" in file.content_type else "image/jpeg"
                b64 = base64.b64encode(content).decode("utf-8")
                return f"data:{mime};base64,{b64}"
        except Exception as be:
            print(f"[WARN] Serverless base64 encoding fallback error: {be}")

    try:
        folder = UPLOAD_DIR / subfolder
        folder.mkdir(parents=True, exist_ok=True)
        dest = folder / filename
        file.file.seek(0)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return f"/static/uploads/{subfolder}/{filename}"
    except Exception as e:
        print(f"Serverless local save warning ({e}), falling back to base64 or /tmp...")
        try:
            file.file.seek(0)
            content = file.file.read()
            if content:
                mime = file.content_type if file.content_type and "image" in file.content_type else "image/jpeg"
                b64 = base64.b64encode(content).decode("utf-8")
                return f"data:{mime};base64,{b64}"
        except Exception:
            pass

        tmp_folder = Path("/tmp/uploads") / subfolder
        tmp_folder.mkdir(parents=True, exist_ok=True)
        dest = tmp_folder / filename
        file.file.seek(0)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return f"/static/uploads/{subfolder}/{filename}"


def _try_cloudinary(file: UploadFile, folder: str) -> str | None:
    """Attempt Cloudinary upload; return URL or None on failure/not-configured."""
    try:
        from app.config import get_settings
        import cloudinary
        import cloudinary.uploader

        settings = get_settings()
        if not settings.CLOUDINARY_CLOUD_NAME:
            return None

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
        )
        file.file.seek(0)
        result = cloudinary.uploader.upload(
            file.file,
            folder=f"Go2Pick/{folder}",
            resource_type="auto",
        )
        return result["secure_url"]
    except Exception:
        return None


async def upload_file(file: UploadFile, subfolder: str = "general", allowed_types: Optional[set] = None) -> str:
    """Upload a file to Cloudinary (fallback: local). Returns URL."""
    if allowed_types and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}.",
        )

    # Validate file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size allowed is {MAX_FILE_SIZE_MB}MB.",
        )

    # Try Cloudinary first
    file.file.seek(0)
    url = _try_cloudinary(file, subfolder)
    if url:
        return url

    # Fallback to local storage
    file.file.seek(0)
    return _save_local(file, subfolder)


async def upload_image(file: UploadFile, subfolder: str = "images") -> str:
    return await upload_file(file, subfolder, ALLOWED_IMAGE_TYPES)


async def upload_document(file: UploadFile, subfolder: str = "documents") -> str:
    return await upload_file(file, subfolder)


async def upload_import_file(file: UploadFile) -> str:
    return await upload_file(file, "imports", ALLOWED_IMPORT_TYPES)
