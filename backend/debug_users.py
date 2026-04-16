import sys
import os
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.user import User
from app.models.hr import Employee

db = SessionLocal()

print("--- User List ---")
users = db.query(User).all()
for u in users:
    role_name = u.role.name if u.role else "No Role"
    print(f"Email: {u.email} | EmployeeID: {u.employee_id} | Role: {role_name}")

print("\n--- Employee List ---")
employees = db.query(Employee).all()
for e in employees:
    print(f"ID: {e.id} | Name: {e.first_name} {e.last_name} | Email: {e.email}")

db.close()
