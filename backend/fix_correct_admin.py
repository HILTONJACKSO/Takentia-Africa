import sqlite3
import os

db_path = 'talentia.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

email = 'admin@talentia.africa'

# 1. Create Employee if not exists
cursor.execute("SELECT id FROM employees WHERE email = ?", (email,))
emp_row = cursor.fetchone()

if emp_row:
    emp_id = emp_row[0]
    print(f"Found existing employee ID: {emp_id}")
else:
    print(f"Creating employee record for {email}...")
    cursor.execute("""
        INSERT INTO employees (first_name, last_name, email, department_id, position, contract_type, company_id, status, hire_date) 
        VALUES ('System', 'Admin', ?, 1, 'Super Admin', 'Full Time', 1, 'ACTIVE', '2024-01-01')
    """, (email,))
    emp_id = cursor.lastrowid

# 2. Link User
cursor.execute("UPDATE users SET employee_id = ? WHERE email = ?", (emp_id, email))
conn.commit()

print(f"Successfully linked {email} to Employee ID {emp_id}")
conn.close()
