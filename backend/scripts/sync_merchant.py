import sys
import os
sys.path.insert(0, os.path.abspath('.'))
from datetime import datetime, timezone
from app.database import get_db

db = get_db()
mongo = getattr(db, 'mongo_db', None)
fs = getattr(db, 'firestore_db', None) or db

# 1. Sync shop
f_shop_snap = fs.collection('shops').document('qmtojRtm1FYqBNZNnoyH').get()
if f_shop_snap.exists:
    shop_data = f_shop_snap.to_dict()
    shop_data['ownerId'] = 'OKarhauKaQeafzzdEEhL73lQNR33'
    shop_data['owner_id'] = 'OKarhauKaQeafzzdEEhL73lQNR33'
    shop_data['email'] = 'rajamaran32@gmail.com'
    shop_data['isApproved'] = True
    shop_data['isActive'] = True
    shop_data['status'] = 'active'
    
    if mongo is not None:
        mongo['shops'].replace_one(
            {'_id': 'qmtojRtm1FYqBNZNnoyH'},
            {**shop_data, '_id': 'qmtojRtm1FYqBNZNnoyH', 'id': 'qmtojRtm1FYqBNZNnoyH'},
            upsert=True
        )
        print("Shop qmtojRtm1FYqBNZNnoyH synced to MongoDB!")

# 2. Update user
payload = {
    'role': 'shopkeeper',
    'isShopkeeper': True,
    'shopkeeperStatus': 'approved',
    'shopkeeperDashboardEnabled': True,
    'activeShopId': 'qmtojRtm1FYqBNZNnoyH',
    'shop_id': 'qmtojRtm1FYqBNZNnoyH',
    'activeMode': 'shopkeeper',
    'currentMode': 'shopkeeper',
    'updatedAt': datetime.now(timezone.utc).isoformat()
}

# Update Firestore
fs.collection('users').document('OKarhauKaQeafzzdEEhL73lQNR33').update(payload)
print("Firestore user updated!")

# Update MongoDB
if mongo is not None:
    mongo['users'].update_many(
        {'$or': [{'id': 'OKarhauKaQeafzzdEEhL73lQNR33'}, {'_id': 'OKarhauKaQeafzzdEEhL73lQNR33'}, {'email': 'rajamaran32@gmail.com'}]},
        {'$set': payload}
    )
    print("MongoDB users updated!")

# Also ensure any other application for rajamaran32 is marked approved
fs.collection('shopkeeper_applications').document('ioTIrrBvNuXADUEqZbZa').update({'status': 'approved', 'shopId': 'qmtojRtm1FYqBNZNnoyH'})
if mongo is not None:
    mongo['shopkeeper_applications'].update_many(
        {'email': 'rajamaran32@gmail.com'},
        {'$set': {'status': 'approved', 'shopId': 'qmtojRtm1FYqBNZNnoyH'}}
    )
print("Applications synced and approved!")
