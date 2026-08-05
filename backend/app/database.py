import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import HTTPException
from app.config import get_settings
from pathlib import Path

def resolve_firebase_credentials(path_str: str) -> str:
    path = Path(path_str)
    if path.is_absolute():
        return str(path)
        
    # Check relative to current working directory
    if path.exists():
        return str(path.resolve())
        
    # Find backend directory and project root
    backend_dir = Path(__file__).resolve().parent.parent
    project_root = backend_dir.parent
    
    # Try resolving relative to project root
    root_resolved = project_root / path
    if root_resolved.exists():
        return str(root_resolved.resolve())
        
    # Try resolving relative to backend directory
    backend_resolved = backend_dir / path
    if backend_resolved.exists():
        return str(backend_resolved.resolve())
        
    # Try stripping "backend/" prefix if already inside backend directory
    if path_str.startswith("backend/"):
        stripped_path = Path(path_str.replace("backend/", "", 1))
        if stripped_path.exists():
            return str(stripped_path.resolve())
        stripped_backend = backend_dir / stripped_path
        if stripped_backend.exists():
            return str(stripped_backend.resolve())

    # Fallback
    return str(path.resolve())


class Database:
    db = None

    @classmethod
    def connect(cls):
        settings = get_settings()
        creds_path = settings.FIREBASE_CREDENTIALS or settings.FIREBASE_CREDENTIALS_PATH
        resolved_path = resolve_firebase_credentials(creds_path)
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(resolved_path)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                })
            cls.db = firestore.client()
            print("Successfully connected to Firebase Cloud Firestore Database.")
        except Exception as e:
            cls.db = None
            print("\n" + "="*80)
            print("CRITICAL ERROR: Firebase Admin SDK could not be initialized.")
            print(f"Credentials path: {creds_path} (Resolved: {resolved_path})")
            print(f"Error details: {str(e)}")
            print("The application will start, but database operations will fail.")
            print("="*80 + "\n")

    @classmethod
    def close(cls):
        # Firestore client uses persistent gRPC connections which do not require manual closing
        pass

    @classmethod
    def get_collection(cls, name: str):
        if cls.db is None:
            raise HTTPException(
                status_code=503,
                detail="Database service is unavailable. Firebase credentials may be missing or invalid."
            )
        return cls.db.collection(name)


def get_db():
    if Database.db is None:
        raise HTTPException(
            status_code=503,
            detail="Database service is unavailable. Firebase credentials may be missing or invalid."
        )
    return Database.db
Keep = True
