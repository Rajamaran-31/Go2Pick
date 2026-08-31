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
        import json
        settings = get_settings()
        creds_config = (settings.FIREBASE_CREDENTIALS or settings.FIREBASE_CREDENTIALS_PATH or "").strip()
        
        try:
            if not firebase_admin._apps:
                # Strip wrapping quotes if present
                if (creds_config.startswith('"') and creds_config.endswith('"')) or (creds_config.startswith("'") and creds_config.endswith("'")):
                    creds_config = creds_config[1:-1].strip()

                if creds_config.startswith('{'):
                    print("Loading Firebase credentials from raw JSON environment variable...")
                    cred_dict = json.loads(creds_config)
                    if "private_key" in cred_dict and isinstance(cred_dict["private_key"], str):
                        cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                    cred = credentials.Certificate(cred_dict)
                else:
                    resolved_path = resolve_firebase_credentials(creds_config)
                    if not Path(resolved_path).exists():
                        print(f"Firebase credentials file not found at: {resolved_path}")
                        cls.db = None
                        return
                    print(f"Loading Firebase credentials from file: {resolved_path}")
                    cred = credentials.Certificate(resolved_path)
                
                firebase_admin.initialize_app(cred, {
                    'storageBucket': getattr(settings, 'FIREBASE_STORAGE_BUCKET', 'go2pick-345bf.firebasestorage.app')
                })

            app_inst = firebase_admin.get_app()
            cls.db = firestore.client(app=app_inst)
            print("Successfully connected to Firebase Cloud Firestore Database.")
        except Exception as e:
            cls.db = None
            print("\n" + "="*80)
            print("CRITICAL ERROR: Firebase Admin SDK could not be initialized.")
            print(f"Error details: {str(e)}")
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
        Database.connect()
    if Database.db is None:
        raise HTTPException(
            status_code=503,
            detail="Database service is unavailable. Firebase credentials may be missing or invalid."
        )
    return Database.db
Keep = True
