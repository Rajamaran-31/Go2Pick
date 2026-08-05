import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_db, Database

def print_users():
    Database.connect()
    db = get_db()
    
    users = list(db.collection("users").stream())
    for doc in users:
        d = doc.to_dict()
        if d.get("shopkeeperStatus") == "approved":
            print(f"User {d.get('email')}: isShopkeeper={d.get('isShopkeeper')}, shopkeeperDashboardEnabled={d.get('shopkeeperDashboardEnabled')}, status={d.get('shopkeeperStatus')}")

if __name__ == "__main__":
    print_users()
