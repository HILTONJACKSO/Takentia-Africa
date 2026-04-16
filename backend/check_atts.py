import sqlite3
import os
from datetime import date

db_path = 'talentia.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

today = date.today().isoformat()
print(f"--- Attendance Records for {today} ---")
cursor.execute("SELECT id, employee_id, company_id, date, check_in, check_out, status FROM attendance WHERE date = ?", (today,))
records = cursor.fetchall()
if not records:
    print("No records found for today.")
for r in records:
    print(f"ID: {r[0]} | EmpID: {r[1]} | CoID: {r[2]} | Date: {r[3]} | In: {r[4]} | Out: {r[5]} | Status: {r[6]}")

conn.close()
