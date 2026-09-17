import sys
import os
sys.path.insert(0, os.path.abspath('.'))
from datetime import datetime, timezone
from app.database import get_db

db = get_db()
mongo = getattr(db, 'mongo_db', None)
if mongo is None:
    print("Error: MongoDB connection is not available.")
    sys.exit(1)

# 1. Ensure shop qmtojRtm1FYqBNZNnoyH exists in MongoDB
shop_data = {
    '_id': 'qmtojRtm1FYqBNZNnoyH',
    'id': 'qmtojRtm1FYqBNZNnoyH',
    'name': 'grany grocery shop',
    'shopName': 'grany grocery shop',
    'ownerId': 'OKarhauKaQeafzzdEEhL73lQNR33',
    'owner_id': 'OKarhauKaQeafzzdEEhL73lQNR33',
    'email': 'rajamaran32@gmail.com',
    'businessEmail': 'rajamaran32@gmail.com',
    'category': 'grocery',
    'description': 'Fresh groceries and daily essentials pre-order store',
    'address': 'lakshmanapudhur, vettapattu',
    'city': 'nattrampalli',
    'pincode': '635852',
    'phone': '+918778783962',
    'businessPhone': '+918778783962',
    'imageUrl': '/static/uploads/general/1700e21446d24f9cba818d3bcfc7fdb5.png',
    'coverImageUrl': '/static/uploads/general/a4b7ad6e0dc44e8b8c1d6ef80f5cf6d5.png',
    'isApproved': True,
    'isActive': True,
    'status': 'active',
    'updatedAt': datetime.now(timezone.utc).isoformat()
}

mongo['shops'].replace_one(
    {'_id': 'qmtojRtm1FYqBNZNnoyH'},
    shop_data,
    upsert=True
)
print("Shop qmtojRtm1FYqBNZNnoyH confirmed in MongoDB!")

# 2. Update user in MongoDB
user_payload = {
    'role': 'shopkeeper',
    'isShopkeeper': True,
    'shopkeeperStatus': 'approved',
    'shopkeeperDashboardEnabled': True,
    'activeShopId': 'qmtojRtm1FYqBNZNnoyH',
    'shop_id': 'qmtojRtm1FYqBNZNnoyH',
    'activeMode': 'shopkeeper',
    'currentMode': 'shopkeeper',
    'email': 'rajamaran32@gmail.com',
    'updatedAt': datetime.now(timezone.utc).isoformat()
}

# Delete any legacy document for this email if its _id is not the Firebase UID
mongo['users'].delete_many({
    'email': 'rajamaran32@gmail.com',
    '_id': {'$ne': 'OKarhauKaQeafzzdEEhL73lQNR33'}
})

user_doc = {
    '_id': 'OKarhauKaQeafzzdEEhL73lQNR33',
    'id': 'OKarhauKaQeafzzdEEhL73lQNR33',
    'fullName': 'rajamaran32',
    'name': 'rajamaran32',
    'phone': '+918778783962',
    **user_payload
}

mongo['users'].replace_one(
    {'_id': 'OKarhauKaQeafzzdEEhL73lQNR33'},
    user_doc,
    upsert=True
)
print("User OKarhauKaQeafzzdEEhL73lQNR33 confirmed as approved shopkeeper in MongoDB!")

# 3. Ensure approved application exists in MongoDB
mongo['shopkeeper_applications'].update_many(
    {'$or': [{'email': 'rajamaran32@gmail.com'}, {'applicantEmail': 'rajamaran32@gmail.com'}, {'userId': 'OKarhauKaQeafzzdEEhL73lQNR33'}, {'applicantId': 'OKarhauKaQeafzzdEEhL73lQNR33'}]},
    {'$set': {
        'status': 'approved',
        'shopId': 'qmtojRtm1FYqBNZNnoyH',
        'reviewedAt': datetime.now(timezone.utc).isoformat(),
        'updatedAt': datetime.now(timezone.utc).isoformat()
    }}
)
print("Shopkeeper applications approved in MongoDB!")
print("\nMerchant setup in MongoDB Atlas is 100% complete!")
