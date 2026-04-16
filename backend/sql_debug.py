import sqlite3
import os

db_path = 'talentia.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- User Accounts ---")
cursor.execute("SELECT id, email, role_id, employee_id FROM users")
users = cursor.fetchall()
for u in users:
    print(f"ID: {u[0]} | Email: {u[1]} | RoleID: {u[2]} | EmployeeID: {u[3]}")

print("\n--- Employee Records ---")
cursor.execute("SELECT id, first_name, last_name, email, company_id FROM employees")
emps = cursor.fetchall()
for e in emps:
    print(f"ID: {e[0]} | Name: {e[1]} {e[2]} | Email: {e[3]} | CompanyID: {e[4]}")

conn.close()
