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
    from app.database import get_db
    print("Connecting to databases via get_db()...", flush=True)
    db = get_db()
    mongo_db = getattr(db, 'mongo_db', None)
    fs_db = getattr(db, 'firestore_db', None)
    
    if mongo_db is None:
        print("[ERROR] MongoDB is not connected! Aborting migration.", flush=True)
        return
    if fs_db is None:
        print("[ERROR] Firestore is not connected! Aborting migration.", flush=True)
        return

    print("Both MongoDB Atlas and Firestore are connected successfully!", flush=True)
    
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
            
            doc_ref = fs_db.collection(coll_name).document(doc_id)
            doc_ref.set(clean, merge=True)
            migrated += 1
                
        print(f"  -> Migrated/Merged {migrated} documents for '{coll_name}'.", flush=True)

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
