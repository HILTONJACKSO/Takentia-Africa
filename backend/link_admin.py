import sqlite3
import os

db_path = 'talentia.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if link already exists
cursor.execute("SELECT employee_id FROM users WHERE email = 'talentia-hr@example.com'")
row = cursor.fetchone()

if row and row[0]:
    print(f"User already linked to Employee ID: {row[0]}")
else:
    # Check if a matching employee exists
    cursor.execute("SELECT id FROM employees WHERE email = 'talentia-hr@example.com'")
    emp_row = cursor.fetchone()
    
    if emp_row:
        emp_id = emp_row[0]
        print(f"Found existing employee for email. Linking...")
    else:
        # Create a mock employee for the admin
        print("Creating new employee record for Talentia Admin...")
        cursor.execute("""
            INSERT INTO employees (first_name, last_name, email, department_id, position, contract_type, company_id, status, hire_date) 
            VALUES ('Talentia', 'Admin', 'talentia-hr@example.com', 1, 'Super Admin', 'Full Time', 1, 'ACTIVE', '2024-01-01')
        """)
        emp_id = cursor.lastrowid
    
    cursor.execute("UPDATE users SET employee_id = ? WHERE email = 'talentia-hr@example.com'", (emp_id,))
    conn.commit()
    print(f"Successfully linked talentia-hr@example.com to Employee ID {emp_id}")

conn.close()
