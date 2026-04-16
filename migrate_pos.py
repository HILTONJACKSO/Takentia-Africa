import sqlite3
import os

db_path = "backend/talentia.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column_if_missing(table, column, type):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    if column not in columns:
        print(f"Adding {column} to {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type}")
        conn.commit()
    else:
        print(f"Column {column} already exists in {table}.")

add_column_if_missing("revenues", "payment_method", "VARCHAR")
add_column_if_missing("expenses", "payment_method", "VARCHAR")

conn.close()
print("Migration check complete.")
