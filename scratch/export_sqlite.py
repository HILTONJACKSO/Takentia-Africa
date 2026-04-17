import sqlite3
import json

db_path = "backend/talentia.db"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall() if not row[0].startswith('sqlite_') and row[0] != 'alembic_version']

data = {}

for table in tables:
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    data[table] = [dict(row) for row in rows]

with open("sqlite_data_dump.json", "w") as f:
    json.dump(data, f, indent=2)

conn.close()
print(f"Dumped {len(tables)} tables to sqlite_data_dump.json")
