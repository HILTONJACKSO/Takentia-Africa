import sqlite3
import os

db_path = "backend/talentia.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Revenues table info:")
cursor.execute("PRAGMA table_info(revenues)")
for row in cursor.fetchall():
    print(row)

print("\nExpenses table info:")
cursor.execute("PRAGMA table_info(expenses)")
for row in cursor.fetchall():
    print(row)

conn.close()
