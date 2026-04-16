import sqlite3
import os
from datetime import date, timedelta
import random

def seed():
    db_path = 'talentia.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Ensure companies IDs are correct
    # 2: Orange Liberia
    # 3: African Finch Logging

    # Seed Departments if they don't exist
    depts = [
        ("Network Operations",),
        ("Customer Service",),
        ("Fleet Management",),
        ("Forestry Operations",)
    ]
    cursor.executemany("INSERT OR IGNORE INTO departments (name) VALUES (?)", depts)
    conn.commit()

    # Get Dept IDs
    cursor.execute("SELECT id, name FROM departments")
    dept_map = {name: id for id, name in cursor.fetchall()}

    # Sample Employees for Orange Liberia (ID: 2)
    orange_employees = [
        ("Alice", "Vandross", "alice.v@orange.lr", dept_map["Network Operations"], "Senior Engineer", "Full-time", 2),
        ("Bob", "Siaway", "bob.s@orange.lr", dept_map["Network Operations"], "NOC Technician", "Full-time", 2),
        ("Clarice", "Dixon", "clarice.d@orange.lr", dept_map["Customer Service"], "Support Lead", "Contract", 2)
    ]

    # Sample Employees for African Finch (ID: 3)
    finch_employees = [
        ("David", "Kanneh", "david.k@af-logging.com", dept_map["Forestry Operations"], "Head of Logging", "Full-time", 3),
        ("Emmanuel", "Sirleaf", "emmanuel.s@af-logging.com", dept_map["Fleet Management"], "Lead Driver", "Full-time", 3),
        ("Fatu", "Sheriff", "fatu.s@af-logging.com", dept_map["Forestry Operations"], "Environmental Officer", "Contract", 3)
    ]

    all_employees = orange_employees + finch_employees
    
    today = date.today()
    hire_date = (today - timedelta(days=365)).isoformat()

    for first, last, email, dept_id, pos, contract, comp_id in all_employees:
        cursor.execute("""
            INSERT OR IGNORE INTO employees 
            (first_name, last_name, email, department_id, position, contract_type, status, hire_date, company_id, base_salary)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
        """, (first, last, email, dept_id, pos, contract, hire_date, comp_id, random.uniform(500, 2000)))

    conn.commit()
    print("Seed data for companies completed.")
    conn.close()

if __name__ == "__main__":
    seed()
