import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import HTTPException
from app.config import get_settings
from pathlib import Path
import pymongo
from typing import Any, Dict, List, Optional

def resolve_firebase_credentials(path_str: str) -> str:
    path = Path(path_str)
    if path.is_absolute():
        return str(path)
    if path.exists():
        return str(path.resolve())
    backend_dir = Path(__file__).resolve().parent.parent
    project_root = backend_dir.parent
    root_resolved = project_root / path
    if root_resolved.exists():
        return str(root_resolved.resolve())
    backend_resolved = backend_dir / path
    if backend_resolved.exists():
        return str(backend_resolved.resolve())
    if path_str.startswith("backend/"):
        stripped_path = Path(path_str.replace("backend/", "", 1))
        if stripped_path.exists():
            return str(stripped_path.resolve())
        stripped_backend = backend_dir / stripped_path
        if stripped_backend.exists():
            return str(stripped_backend.resolve())
    return str(path.resolve())


# ─── Resilient MongoDB Atlas Collection Wrapper ─────────────────────────────

class MongoDocSnap:
    def __init__(self, doc: Optional[Dict[str, Any]], doc_id: str = ""):
        self._doc = doc or {}
        self.exists = doc is not None
        self.id = doc_id or str(self._doc.get('_id', self._doc.get('id', '')))

    def to_dict(self) -> Dict[str, Any]:
        d = dict(self._doc)
        if '_id' in d and not isinstance(d['_id'], str):
            d['_id'] = str(d['_id'])
        return d


class MongoDocRef:
    def __init__(self, coll: Any, doc_id: str):
        self.coll = coll
        self.id = doc_id

    def get(self) -> MongoDocSnap:
        doc = self.coll.find_one({'_id': self.id}) or self.coll.find_one({'id': self.id})
        return MongoDocSnap(doc, doc_id=self.id)

    def set(self, data: Dict[str, Any]):
        data_copy = dict(data)
        data_copy['id'] = self.id
        data_copy['_id'] = self.id
        self.coll.replace_one({'_id': self.id}, data_copy, upsert=True)

    def update(self, data: Dict[str, Any]):
        self.coll.update_one({'_id': self.id}, {'$set': data})


class MongoQueryWrapper:
    def __init__(self, coll: Any, query: Optional[Dict[str, Any]] = None, limit_val: int = 0):
        self.coll = coll
        self.query = query or {}
        self.limit_val = limit_val

    def where(self, field: str, op: str, val: Any) -> "MongoQueryWrapper":
        q = dict(self.query)
        if op == '==':
            q[field] = val
        return MongoQueryWrapper(self.coll, q, self.limit_val)

    def limit(self, n: int) -> "MongoQueryWrapper":
        return MongoQueryWrapper(self.coll, self.query, limit_val=n)

    def stream(self):
        cur = self.coll.find(self.query)
        if self.limit_val > 0:
            cur = cur.limit(self.limit_val)
        for doc in cur:
            yield MongoDocSnap(doc)

    def document(self, doc_id: Optional[str] = None) -> MongoDocRef:
        import uuid
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return MongoDocRef(self.coll, doc_id)


class MongoDatabaseWrapper:
    def __init__(self, mongo_db: Any, firestore_db: Any = None):
        self.mongo_db = mongo_db
        self.firestore_db = firestore_db

    def collection(self, name: str) -> MongoQueryWrapper:
        if self.mongo_db is not None:
            return MongoQueryWrapper(self.mongo_db[name])
        return self.firestore_db.collection(name)


class Database:
    db = None

    @classmethod
    def connect(cls):
        settings = get_settings()
        
        # 1. Connect MongoDB Atlas
        mongo_client = None
        mongo_db = None
        mongo_url = settings.MONGODB_URL or "mongodb://rajamaran32:maran2007@ac-xvjluyj-shard-00-00.hobeyx3.mongodb.net:27017,ac-xvjluyj-shard-00-01.hobeyx3.mongodb.net:27017,ac-xvjluyj-shard-00-02.hobeyx3.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority"
        db_name = settings.DATABASE_NAME or "go2pick"
        try:
            mongo_client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
            mongo_db = mongo_client[db_name]
            print(f"Successfully connected to MongoDB Atlas database: {db_name}")
        except Exception as me:
            print(f"[WARN] MongoDB Atlas connection error: {me}")

        # 2. Try Firebase Admin SDK
        fs_db = None
        try:
            import json
            creds_config = (settings.FIREBASE_CREDENTIALS or settings.FIREBASE_CREDENTIALS_PATH or "").strip()
            if not firebase_admin._apps:
                if (creds_config.startswith('"') and creds_config.endswith('"')) or (creds_config.startswith("'") and creds_config.endswith("'")):
                    creds_config = creds_config[1:-1].strip()
                if creds_config.startswith('{'):
                    cred_dict = json.loads(creds_config)
                    if "private_key" in cred_dict and isinstance(cred_dict["private_key"], str):
                        cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                    cred = credentials.Certificate(cred_dict)
                else:
                    resolved_path = resolve_firebase_credentials(creds_config)
                    if Path(resolved_path).exists():
                        cred = credentials.Certificate(resolved_path)
                        firebase_admin.initialize_app(cred, {
                            'storageBucket': getattr(settings, 'FIREBASE_STORAGE_BUCKET', 'go2pick-345bf.firebasestorage.app')
                        })
            if firebase_admin._apps:
                app_inst = firebase_admin.get_app()
                fs_db = firestore.client(app=app_inst)
                print("Successfully initialized Firebase Cloud Firestore SDK.")
        except Exception as fe:
            print(f"[WARN] Firebase Admin SDK init skipped: {fe}")

        if mongo_db is not None:
            cls.db = MongoDatabaseWrapper(mongo_db, fs_db)
        elif fs_db is not None:
            cls.db = fs_db
        else:
            cls.db = None

    @classmethod
    def close(cls):
        pass

    @classmethod
    def get_collection(cls, name: str):
        if cls.db is None:
            raise HTTPException(
                status_code=503,
                detail="Database service is unavailable."
            )
        return cls.db.collection(name)


def get_db():
    if Database.db is None:
        Database.connect()
    if Database.db is None:
        raise HTTPException(
            status_code=503,
            detail="Database service is unavailable."
        )
    return Database.db
