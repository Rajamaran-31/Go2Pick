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

from bson import ObjectId

def build_id_filter(doc_id: Any) -> Dict[str, Any]:
    if doc_id is None:
        return {"_id": None}
    s_id = str(doc_id).strip()
    candidates: List[Dict[str, Any]] = [{"_id": s_id}, {"id": s_id}]
    if len(s_id) == 24 and all(c in '0123456789abcdefABCDEF' for c in s_id):
        try:
            oid = ObjectId(s_id)
            candidates.append({"_id": oid})
            candidates.append({"id": oid})
        except Exception:
            pass
    if isinstance(doc_id, ObjectId):
        candidates.append({"_id": doc_id})
    return {"$or": candidates}


class MongoDocSnap:
    def __init__(self, doc: Optional[Dict[str, Any]], doc_id: str = ""):
        self._doc = doc or {}
        self.exists = doc is not None
        _raw_id = self._doc.get('_id', self._doc.get('id', ''))
        self.id = doc_id or (str(_raw_id) if _raw_id else "")

    def to_dict(self) -> Dict[str, Any]:
        d = dict(self._doc)
        str_id = str(d.get('_id', d.get('id', self.id)))
        d['_id'] = str_id
        d['id'] = str_id
        for k, v in list(d.items()):
            if isinstance(v, ObjectId):
                d[k] = str(v)
        return d


class MongoDocRef:
    def __init__(self, coll: Any, doc_id: str, fs_coll: Any = None):
        self.coll = coll
        self.id = str(doc_id)
        self.fs_coll = fs_coll

    def get(self) -> MongoDocSnap:
        filter_q = build_id_filter(self.id)
        doc = self.coll.find_one(filter_q)
        return MongoDocSnap(doc, doc_id=self.id)

    def set(self, data: Dict[str, Any]):
        data_copy = dict(data)
        data_copy['id'] = str(self.id)
        filter_q = build_id_filter(self.id)
        existing = self.coll.find_one(filter_q)
        if existing and '_id' in existing:
            target_id = existing['_id']
            data_copy['_id'] = target_id
            self.coll.replace_one({'_id': target_id}, data_copy, upsert=True)
        else:
            data_copy['_id'] = self.id
            self.coll.replace_one({'_id': self.id}, data_copy, upsert=True)

        if self.fs_coll is not None:
            try:
                self.fs_coll.document(str(self.id)).set(data)
            except Exception:
                pass

    def update(self, data: Dict[str, Any]):
        filter_q = build_id_filter(self.id)
        self.coll.update_many(filter_q, {'$set': data})

        if self.fs_coll is not None:
            try:
                self.fs_coll.document(str(self.id)).update(data)
            except Exception:
                pass

    def delete(self):
        filter_q = build_id_filter(self.id)
        self.coll.delete_many(filter_q)

        if self.fs_coll is not None:
            try:
                self.fs_coll.document(str(self.id)).delete()
            except Exception:
                pass


class MongoQueryWrapper:
    def __init__(self, coll: Any, query: Optional[Dict[str, Any]] = None, limit_val: int = 0, fs_coll: Any = None):
        self.coll = coll
        self.query = query or {}
        self.limit_val = limit_val
        self.fs_coll = fs_coll

    def where(self, field: str, op: str, val: Any) -> "MongoQueryWrapper":
        q = dict(self.query)
        if op == '==':
            val_oid = None
            if isinstance(val, str) and len(val) == 24 and all(c in '0123456789abcdefABCDEF' for c in val):
                try:
                    val_oid = ObjectId(val)
                except Exception:
                    val_oid = None

            if field in ('_id', 'id'):
                ors = [{"_id": val}, {"id": val}]
                if val_oid:
                    ors.extend([{"_id": val_oid}, {"id": val_oid}])
                if "$and" not in q:
                    q["$and"] = []
                q["$and"].append({"$or": ors})
            elif field in ('shopId', 'shop_id'):
                ors = [{"shopId": val}, {"shop_id": val}]
                if val_oid:
                    ors.extend([{"shopId": val_oid}, {"shop_id": val_oid}])
                if "$and" not in q:
                    q["$and"] = []
                q["$and"].append({"$or": ors})
            elif field in ('ownerId', 'owner_id'):
                ors = [{"ownerId": val}, {"owner_id": val}]
                if val_oid:
                    ors.extend([{"ownerId": val_oid}, {"owner_id": val_oid}])
                if "$and" not in q:
                    q["$and"] = []
                q["$and"].append({"$or": ors})
            elif field in ('userId', 'user_id'):
                ors = [{"userId": val}, {"user_id": val}, {"applicantId": val}]
                if val_oid:
                    ors.extend([{"userId": val_oid}, {"user_id": val_oid}])
                if "$and" not in q:
                    q["$and"] = []
                q["$and"].append({"$or": ors})
            elif field in ('customerId', 'customer_id'):
                ors = [{"customerId": val}, {"customer_id": val}]
                if val_oid:
                    ors.extend([{"customerId": val_oid}, {"customer_id": val_oid}])
                if "$and" not in q:
                    q["$and"] = []
                q["$and"].append({"$or": ors})
            else:
                q[field] = val
        return MongoQueryWrapper(self.coll, q, self.limit_val, self.fs_coll)

    def limit(self, n: int) -> "MongoQueryWrapper":
        return MongoQueryWrapper(self.coll, self.query, limit_val=n, fs_coll=self.fs_coll)

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
        return MongoDocRef(self.coll, str(doc_id), self.fs_coll)

    def add(self, data: Dict[str, Any]):
        import uuid
        data_copy = dict(data)
        doc_id = str(data_copy.get('id') or data_copy.get('_id') or uuid.uuid4())
        data_copy['id'] = doc_id
        data_copy['_id'] = doc_id
        self.coll.replace_one({'_id': doc_id}, data_copy, upsert=True)

        if self.fs_coll is not None:
            try:
                self.fs_coll.document(doc_id).set(data)
            except Exception:
                pass
        return (None, MongoDocRef(self.coll, doc_id, self.fs_coll))


class MongoDatabaseWrapper:
    def __init__(self, mongo_db: Any, firestore_db: Any = None):
        self.mongo_db = mongo_db
        self.firestore_db = firestore_db

    def collection(self, name: str) -> MongoQueryWrapper:
        fs_coll = None
        if self.firestore_db is not None:
            try:
                fs_coll = self.firestore_db.collection(name)
            except Exception:
                pass
        if self.mongo_db is not None:
            return MongoQueryWrapper(self.mongo_db[name], fs_coll=fs_coll)
        if fs_coll is not None:
            return fs_coll
        raise HTTPException(status_code=503, detail="Database collection unavailable")


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
            ca_file = None
            try:
                import certifi
                ca_file = certifi.where()
            except Exception:
                pass

            client_kwargs: Dict[str, Any] = {
                "serverSelectionTimeoutMS": 5000,
                "connectTimeoutMS": 5000,
                "socketTimeoutMS": 5000,
                "tlsAllowInvalidCertificates": True,
            }
            if ca_file:
                client_kwargs["tlsCAFile"] = ca_file

            mongo_client = pymongo.MongoClient(mongo_url, **client_kwargs)
            mongo_client.admin.command('ping')
            mongo_db = mongo_client[db_name]
            print(f"Successfully connected to MongoDB Atlas database: {db_name}")
        except Exception as me:
            print(f"[WARN] MongoDB Atlas connection error: {me}")
            try:
                mongo_client = pymongo.MongoClient(mongo_url, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=4000)
                mongo_client.admin.command('ping')
                mongo_db = mongo_client[db_name]
                print(f"Connected to MongoDB Atlas with fallback TLS: {db_name}")
            except Exception as me2:
                print(f"[WARN] MongoDB Atlas fallback failed: {me2}")
                mongo_db = None

        if mongo_db is not None:
            cls.db = MongoDatabaseWrapper(mongo_db, None)
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
