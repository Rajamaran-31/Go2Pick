import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from datetime import datetime, timezone
import pymongo
from bson import ObjectId
from app.config import get_settings
from app.database import resolve_firebase_credentials
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

def sanitize_doc(doc):
    if not isinstance(doc, dict):
        return doc
    clean = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            clean[k] = str(v)
        elif isinstance(v, datetime):
            clean[k] = v
        elif isinstance(v, dict):
            clean[k] = sanitize_doc(v)
        elif isinstance(v, list):
            clean[k] = [sanitize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
        else:
            clean[k] = v
    return clean

def main():
    settings = get_settings()
    
    # 1. Connect Mongo
    mongo_url = settings.MONGODB_URL
    db_name = settings.DATABASE_NAME or "go2pick"
    print(f"Connecting to MongoDB Atlas: {db_name}...")
    client = pymongo.MongoClient(mongo_url, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    mongo_db = client[db_name]
    
    # 2. Connect Firestore
    print("Connecting to Firebase Cloud Firestore...")
    if not firebase_admin._apps:
        creds_path = resolve_firebase_credentials(settings.FIREBASE_CREDENTIALS or settings.FIREBASE_CREDENTIALS_PATH)
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred, {'storageBucket': settings.FIREBASE_STORAGE_BUCKET})
    fs_db = firestore.client()
    
    collections_to_migrate = ['shops', 'categories', 'products', 'orders', 'reviews', 'shopkeeper_applications', 'notifications', 'users']
    
    for coll_name in collections_to_migrate:
        mongo_docs = list(mongo_db[coll_name].find({}))
        print(f"\nMigrating collection '{coll_name}': {len(mongo_docs)} documents in MongoDB...")
        migrated = 0
        skipped = 0
        
        for m_doc in mongo_docs:
            doc_id = str(m_doc.get('_id') or m_doc.get('id', ''))
            if not doc_id:
                continue
            
            clean = sanitize_doc(m_doc)
            clean['id'] = doc_id
            clean['_id'] = doc_id
            
            # Check if exists in Firestore
            doc_ref = fs_db.collection(coll_name).document(doc_id)
            snap = doc_ref.get()
            
            if coll_name == 'users' and snap.exists:
                # If user already exists in Firestore (e.g. Firebase UID), don't overwrite with Mongo UUID unless fields are missing
                skipped += 1
                continue
                
            if not snap.exists:
                doc_ref.set(clean)
                migrated += 1
            else:
                # Update with any fields from Mongo that are missing in Firestore
                existing = snap.to_dict() or {}
                merged = {**clean, **existing} # keep existing Firestore values, backfill missing
                doc_ref.set(merged, merge=True)
                migrated += 1
                
        print(f"  -> Migrated/Merged {migrated}, Skipped {skipped} for '{coll_name}'.")

    # Specifically ensure rajamaran32's shop is set up and linked
    print("\nEnsuring merchant shop linking in Firestore...")
    fs_db.collection('users').document('OKarhauKaQeafzzdEEhL73lQNR33').set({
        'role': 'shopkeeper',
        'isShopkeeper': True,
        'shopkeeperStatus': 'approved',
        'shopkeeperDashboardEnabled': True,
        'activeShopId': 'qmtojRtm1FYqBNZNnoyH',
        'shop_id': 'qmtojRtm1FYqBNZNnoyH',
        'activeMode': 'shopkeeper',
        'currentMode': 'shopkeeper',
        'email': 'rajamaran32@gmail.com',
        'updatedAt': datetime.now(timezone.utc)
    }, merge=True)
    
    fs_db.collection('shops').document('qmtojRtm1FYqBNZNnoyH').set({
        'ownerId': 'OKarhauKaQeafzzdEEhL73lQNR33',
        'owner_id': 'OKarhauKaQeafzzdEEhL73lQNR33',
        'email': 'rajamaran32@gmail.com',
        'businessEmail': 'rajamaran32@gmail.com',
        'isApproved': True,
        'isActive': True,
        'status': 'active'
    }, merge=True)
    
    print("\nMigration completed successfully!")

if __name__ == '__main__':
    main()
