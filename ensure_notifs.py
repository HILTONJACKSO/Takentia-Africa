import sqlite3
import os

db_path = "backend/talentia.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Creating notifications table if it doesn't exist...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    message VARCHAR NOT NULL,
    link VARCHAR,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)
''')
conn.commit()
conn.close()
print("Notifications table is ready.")
