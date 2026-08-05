import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import get_db, Database

def clean():
    Database.connect()
    db = get_db()
    docs = db.collection('notifications').where('type', '==', 'SHOPKEEPER_APPLICATION').stream()
    batch = db.batch()
    count = 0
    for d in docs:
        data = d.to_dict()
        if data.get('recipientRole') != 'super_admin':
            batch.delete(d.reference)
            count += 1
    if count > 0:
        batch.commit()
    print(f'Deleted {count} incorrect notifications')

if __name__ == '__main__':
    clean()
