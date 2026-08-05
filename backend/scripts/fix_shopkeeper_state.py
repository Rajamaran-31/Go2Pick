import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_db, Database

def fix_shopkeepers():
    Database.connect()
    db = get_db()
    
    print("Finding approved shopkeepers...")
    users_ref = db.collection("users").where("shopkeeperStatus", "==", "approved").stream()
    
    count = 0
    for doc in users_ref:
        user_data = doc.to_dict()
        needs_update = False
        updates = {}
        
        if not user_data.get("isShopkeeper"):
            updates["isShopkeeper"] = True
            needs_update = True
            
        if not user_data.get("shopkeeperDashboardEnabled"):
            updates["shopkeeperDashboardEnabled"] = True
            needs_update = True
            
        if needs_update:
            db.collection("users").document(doc.id).update(updates)
            print(f"Updated user {user_data.get('email')} ({doc.id}) -> {updates}")
            count += 1
            
    print(f"Repair complete. Repaired {count} users.")

if __name__ == "__main__":
    fix_shopkeepers()
