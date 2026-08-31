import sys
import os
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import get_db

def seed_grany_groceries():
    db = get_db()
    now = datetime.now(timezone.utc)
    email = "rajamaran32@gmail.com"

    print(f"[SEED] Starting setup for {email} and 'grany groceries'...")

    # 1. Look up user by email
    user_id = None
    user_doc_ref = None
    try:
        user_docs = list(db.collection("users").where("email", "==", email).stream())
        if user_docs:
            user_doc_ref = db.collection("users").document(user_docs[0].id)
            user_id = user_docs[0].id
            print(f"[SEED] Found existing user account with ID: {user_id}")
    except Exception as e:
        print(f"[WARN] Error searching users collection: {e}")

    if not user_id:
        # Create user document
        doc_ref = db.collection("users").document()
        user_id = doc_ref.id
        user_doc_ref = doc_ref
        user_data = {
            "id": user_id,
            "fullName": "Rajamaran32",
            "name": "Rajamaran32",
            "email": email,
            "role": "shopkeeper",
            "isShopkeeper": True,
            "shopkeeperStatus": "approved",
            "shopkeeperDashboardEnabled": True,
            "activeMode": "shopkeeper",
            "currentMode": "shopkeeper",
            "createdAt": now,
            "updatedAt": now,
        }
        user_doc_ref.set(user_data)
        print(f"[SEED] Created new shopkeeper user document ID: {user_id}")
    else:
        # Update user to full shopkeeper permissions
        user_doc_ref.update({
            "role": "shopkeeper",
            "isShopkeeper": True,
            "shopkeeperStatus": "approved",
            "shopkeeperDashboardEnabled": True,
            "activeMode": "shopkeeper",
            "currentMode": "shopkeeper",
            "updatedAt": now,
        })
        print(f"[SEED] Updated user {user_id} with shopkeeper role & approved status.")

    # 2. Check / Create Shop 'grany groceries'
    shop_id = "shop-grany-groceries"
    shop_ref = db.collection("shops").document(shop_id)

    shop_data = {
        "id": shop_id,
        "name": "grany groceries",
        "shopName": "grany groceries",
        "ownerId": user_id,
        "owner_id": user_id,
        "ownerName": "Rajamaran32",
        "email": email,
        "category": "grocery",
        "address": "123 Main Bazaar Road, Grocery Street",
        "city": "Chennai",
        "pincode": "600001",
        "phone": "+91 98765 43210",
        "description": "Fresh daily vegetables, rice, grains, pulses, snacks, and cooking oils.",
        "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
        "isActive": True,
        "is_active": True,
        "isApproved": True,
        "status": "active",
        "rating": 4.8,
        "ratingCount": 12,
        "totalOrders": 12,
        "totalRevenue": 1450.0,
        "createdAt": now,
        "updatedAt": now,
    }
    shop_ref.set(shop_data)
    print(f"[SEED] Created/Updated shop 'grany groceries' ({shop_id}).")

    # Link activeShopId on user
    user_doc_ref.update({
        "activeShopId": shop_id,
        "shop_id": shop_id,
    })

    # Also update any applications for this email to approved
    try:
        app_docs = list(db.collection("shopkeeper_applications").where("email", "==", email).stream())
        for ad in app_docs:
            db.collection("shopkeeper_applications").document(ad.id).update({
                "status": "approved",
                "reviewedAt": now
            })
            print(f"[SEED] Marked application {ad.id} as approved.")
    except Exception as ae:
        print(f"[WARN] Error updating application docs: {ae}")

    # 3. Add 5 responsive products to 'grany groceries'
    products = [
        {
            "id": "prod-tomato-1",
            "name": "Fresh Red Tomato",
            "shopId": shop_id,
            "shop_id": shop_id,
            "shopName": "grany groceries",
            "category": "grocery",
            "price": 30.0,
            "unit": "1 kg",
            "stock": 50,
            "inStock": True,
            "isAvailable": True,
            "image": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
            "description": "Farm-fresh ripe red tomatoes packed with rich flavor and essential vitamins.",
            "rating": 4.9,
            "createdAt": now
        },
        {
            "id": "prod-rice-2",
            "name": "Premium Basmati Rice",
            "shopId": shop_id,
            "shop_id": shop_id,
            "shopName": "grany groceries",
            "category": "grocery",
            "price": 60.0,
            "unit": "1 kg",
            "stock": 100,
            "inStock": True,
            "isAvailable": True,
            "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
            "description": "Long grain aromatic white basmati rice, perfect for daily meals and biryani.",
            "rating": 4.8,
            "createdAt": now
        },
        {
            "id": "prod-potato-3",
            "name": "Farm Fresh Potato",
            "shopId": shop_id,
            "shop_id": shop_id,
            "shopName": "grany groceries",
            "category": "grocery",
            "price": 25.0,
            "unit": "1 kg",
            "stock": 50,
            "inStock": True,
            "isAvailable": True,
            "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
            "description": "Clean, nutrient-rich potatoes suitable for roasting, frying, and curries.",
            "rating": 4.7,
            "createdAt": now
        },
        {
            "id": "prod-biscuit-4",
            "name": "Crunchy Butter Biscuits",
            "shopId": shop_id,
            "shop_id": shop_id,
            "shopName": "grany groceries",
            "category": "grocery",
            "price": 20.0,
            "unit": "1 pack",
            "stock": 40,
            "inStock": True,
            "isAvailable": True,
            "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
            "description": "Crispy baked butter cookies for a rich, delicious tea time snack.",
            "rating": 4.9,
            "createdAt": now
        },
        {
            "id": "prod-oil-5",
            "name": "Pure Sunflower Cooking Oil",
            "shopId": shop_id,
            "shop_id": shop_id,
            "shopName": "grany groceries",
            "category": "grocery",
            "price": 140.0,
            "unit": "1 L",
            "stock": 30,
            "inStock": True,
            "isAvailable": True,
            "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
            "description": "Light, refined sunflower cooking oil ideal for healthy daily cooking.",
            "rating": 4.8,
            "createdAt": now
        }
    ]

    for p in products:
        p_ref = db.collection("products").document(p["id"])
        p_ref.set(p)
        print(f"[SEED] Added product: {p['name']} (Rs.{p['price']}) to shop {shop_id}")

    print("\n[SUCCESS] Seed complete!")
    print(f"User: {email} is now an APPROVED Shopkeeper for 'grany groceries'.")
    print("5 Products (Tomato, Rice, Potato, Biscuits, Oil) seeded successfully!")

if __name__ == "__main__":
    seed_grany_groceries()
