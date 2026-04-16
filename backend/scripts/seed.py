import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from app.core.database import SessionLocal
from app.models.user import Role, User
from app.models.hr import Department, Employee, EmploymentStatus, Attendance, AttendanceStatus, PerformanceReview
from app.models.payroll import PayrollRun, Payslip
from app.models.company import Company
from app.models.operations import PettyCashAccount, PettyCashTransaction, TransactionType, Asset, CashMovement, PaymentRequest, Revenue, Expense, Maintenance
from app.core.security import get_password_hash

from app.core.database import SessionLocal, engine, Base

def seed_db():
    print("Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Seed Roles
    roles = ["Super Admin", "HR Manager", "Finance Manager", "Operations Officer", "Staff"]
    role_objs = {}
    for role_name in roles:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name)
            db.add(role)
            db.commit()
            db.refresh(role)
        role_objs[role_name] = role

    # 2. Seed Admin User
    if not db.query(User).filter(User.email == "admin@gmail.com").first():
        admin = User(
            email="admin@gmail.com",
            password_hash=get_password_hash("password123"),
            role_id=role_objs["Super Admin"].id,
            is_active=True
        )
        db.add(admin)
        db.commit()

    # 3. Seed Companies
    companies = ["Talentia Africa", "Orange Liberia", "African Finch Logging"]
    company_objs = {}
    for c_name in companies:
        company = db.query(Company).filter(Company.name == c_name).first()
        if not company:
            company = Company(name=c_name, description=f"{c_name} Operations")
            db.add(company)
            db.commit()
            db.refresh(company)
        company_objs[c_name] = company

    # 4. Seed Departments
    depts = ["Human Resources", "Finance", "Operations", "IT Support", "Marketing", "Sales"]
    dept_objs = {}
    for d_name in depts:
        dept = db.query(Department).filter(Department.name == d_name).first()
        if not dept:
            dept = Department(name=d_name)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        dept_objs[d_name] = dept

    # 4. Seed Employees
    employees_data = [
        {
            "first_name": "John", "last_name": "Doe", "email": "john.doe@talentia.africa",
            "phone": "+231-886-123456", "dept": "IT Support", "pos": "Senior Developer",
            "contract": "Full-time", "status": EmploymentStatus.ACTIVE,
            "hire_date": date(2023, 1, 15), "dob": date(1990, 5, 12), "qual": "MSc Computer Science",
            "base_salary": 4500.0, "company": "Talentia Africa"
        },
        {
            "first_name": "Sarah", "last_name": "Johnson", "email": "sarah.j@talentia.africa",
            "phone": "+231-886-654321", "dept": "Human Resources", "pos": "HR Director",
            "contract": "Full-time", "status": EmploymentStatus.ACTIVE,
            "hire_date": date(2022, 6, 1), "dob": date(1985, 2, 28), "qual": "MBA HR Management",
            "base_salary": 5000.0, "company": "Talentia Africa"
        },
        {
            "first_name": "Michael", "last_name": "Brown", "email": "m.brown@orangeliberia.com",
            "phone": "+231-770-112233", "dept": "Finance", "pos": "Chief Accountant",
            "contract": "Full-time", "status": EmploymentStatus.ON_LEAVE,
            "hire_date": date(2021, 11, 10), "dob": date(1988, 12, 1), "qual": "Certified Public Accountant",
            "base_salary": 5500.0, "company": "Orange Liberia"
        },
        {
            "first_name": "Lydia", "last_name": "Kamara", "email": "lydia.k@orangeliberia.com",
            "phone": "+231-770-445566", "dept": "Operations", "pos": "Logistics Manager",
            "contract": "Contract", "status": EmploymentStatus.ACTIVE,
            "hire_date": date(2024, 1, 10), "dob": date(1995, 3, 15), "qual": "BSc Logistics",
            "base_salary": 3800.0, "company": "Orange Liberia"
        },
        {
            "first_name": "Robert", "last_name": "Wilson", "email": "r.wilson@africanfinch.com",
            "phone": "+231-886-990011", "dept": "Marketing", "pos": "Brand Specialist",
            "contract": "Full-time", "status": EmploymentStatus.PROSPECTIVE,
            "hire_date": date(2026, 3, 1), "dob": date(1993, 7, 20), "qual": "BSc Marketing",
            "base_salary": 3200.0, "company": "African Finch Logging"
        },
        {
            "first_name": "Grace", "last_name": "Weah", "email": "g.weah@africanfinch.com",
            "phone": "+231-770-223344", "dept": "Sales", "pos": "Sales Executive",
            "contract": "Full-time", "status": EmploymentStatus.ACTIVE,
            "hire_date": date(2025, 10, 5), "dob": date(1998, 2, 27), "qual": "High School Diploma",
            "base_salary": 2500.0, "company": "African Finch Logging"
        },
    ]

    # Add more for birthday table testing (upcoming birthdays)
    today = date.today()
    employees_data.append({
        "first_name": "Faith", "last_name": "Tamba", "email": "faith.t@talentia.africa",
        "phone": "+231-886-778899", "dept": "Finance", "pos": "Junior Accountant",
        "contract": "Full-time", "status": EmploymentStatus.ACTIVE,
        "hire_date": date(2025, 2, 1), 
        "dob": date(1997, today.month, (today.day + 2) % 28 or 1), 
        "qual": "BSc Accounting",
        "base_salary": 2800.0, "company": "Talentia Africa"
    })

    db_employees = []
    for emp_data in employees_data:
        if not db.query(Employee).filter(Employee.email == emp_data["email"]).first():
            employee = Employee(
                first_name=emp_data["first_name"],
                last_name=emp_data["last_name"],
                email=emp_data["email"],
                phone=emp_data["phone"],
                department_id=dept_objs[emp_data["dept"]].id,
                position=emp_data["pos"],
                contract_type=emp_data["contract"],
                status=emp_data["status"],
                hire_date=emp_data["hire_date"],
                date_of_birth=emp_data["dob"],
                qualification=emp_data["qual"],
                base_salary=emp_data["base_salary"],
                company_id=company_objs[emp_data["company"]].id
            )
            db.add(employee)
            db_employees.append(employee)
    
    db.commit()
    for e in db_employees:
        db.refresh(e)

    # 6. Seed Attendance (Last 30 days)
    print("Seeding attendance records...")
    import random
    for emp in db_employees:
        if emp.status == EmploymentStatus.PROSPECTIVE:
            continue
            
        for i in range(30):
            record_date = date.today() - timedelta(days=i)
            if record_date.weekday() >= 5: # Skip weekends
                continue
                
            # Randomize status
            status_roll = random.random()
            if emp.status == EmploymentStatus.ON_LEAVE:
                att_status = AttendanceStatus.ON_LEAVE
                check_in, check_out = None, None
            elif status_roll < 0.8:
                att_status = AttendanceStatus.PRESENT
                check_in = f"0{random.randint(7, 8)}:{random.randint(10, 59)}"
                check_out = f"{random.randint(17, 18)}:{random.randint(10, 59)}"
            elif status_roll < 0.9:
                att_status = AttendanceStatus.LATE
                check_in = f"09:{random.randint(10, 45)}"
                check_out = f"17:{random.randint(30, 59)}"
            else:
                att_status = AttendanceStatus.ABSENT
                check_in, check_out = None, None
                
            attendance = Attendance(
                employee_id=emp.id,
                company_id=emp.company_id,
                date=record_date,
                check_in=check_in,
                check_out=check_out,
                status=att_status,
                notes="Automated seed entry"
            )
            db.add(attendance)

    # 7. Seed Performance Reviews
    print("Seeding performance reviews...")
    for emp in db_employees:
        # One recent review for most active employees
        if emp.status == EmploymentStatus.ACTIVE and random.random() > 0.2:
            review = PerformanceReview(
                employee_id=emp.id,
                company_id=emp.company_id,
                reviewer_id=1, # Admin
                review_date=date.today() - timedelta(days=random.randint(5, 90)),
                rating=random.randint(3, 5),
                comments=f"Consistent performance in {emp.position} role. Strong team player.",
                goals="Enhance technical proficiency and leadership skills.",
                strengths="Reliability, Communication, Quality of work.",
                improvements="Time management under high pressure."
            )
            db.add(review)
            db.commit()

    # 8. Seed Petty Cash
    print("Seeding petty cash accounts and transactions...")
    for c_name_str, c_obj in company_objs.items():
        # Create a main petty cash account for each company
        pc_account = PettyCashAccount(
            name=f"{c_name_str} Main Petty Cash",
            balance=1500.0,
            company_id=c_obj.id
        )
        db.add(pc_account)
        db.commit()
        db.refresh(pc_account)
        
        # Add some transactions
        transactions = [
            {"type": TransactionType.IN, "amount": 2000.0, "desc": "Initial Funding", "days_ago": 15},
            {"type": TransactionType.OUT, "amount": 150.0, "desc": "Office Supplies", "days_ago": 10},
            {"type": TransactionType.OUT, "amount": 80.0, "desc": "Local Transport", "days_ago": 5},
            {"type": TransactionType.OUT, "amount": 270.0, "desc": "Catering for Staff Meeting", "days_ago": 2},
        ]
        
        for tx in transactions:
            new_tx = PettyCashTransaction(
                account_id=pc_account.id,
                company_id=c_obj.id,
                type=tx["type"],
                amount=tx["amount"],
                description=tx["desc"],
                date=date.today() - timedelta(days=tx["days_ago"]),
                approved_by_id=1
            )
            db.add(new_tx)
        
        db.commit()

    # 9. Seed Assets
    print("Seeding assets...")
    asset_types = [
        {"name": "Dell XPS 15", "cat": "Laptops"},
        {"name": "MacBook Pro M3", "cat": "Laptops"},
        {"name": "Toyota Hilux", "cat": "Vehicles"},
        {"name": "Office Chair Premium", "cat": "Furniture"},
        {"name": "HP LaserJet Printer", "cat": "Office Equipment"},
    ]
    
    for c_name_str, c_obj in company_objs.items():
        # Get one employee from this company to assign an asset
        emp = db.query(Employee).filter(Employee.company_id == c_obj.id).first()
        
        for i, at in enumerate(asset_types):
            asset = Asset(
                name=f"{c_name_str} {at['name']}",
                category=at['cat'],
                serial_number=f"{c_name_str[:3].upper()}-{at['cat'][:3].upper()}-{1000+i}",
                status="ACTIVE" if i < 4 else "IN MAINTENANCE",
                company_id=c_obj.id,
                assigned_to_id=emp.id if emp and i < 2 else None
            )
            db.add(asset)
    
    # 10. Seed Cash Movements
    print("Seeding cash movements...")
    for c_name_str, c_obj in company_objs.items():
        pc_account = db.query(PettyCashAccount).filter(PettyCashAccount.company_id == c_obj.id).first()
        if pc_account:
            movement = CashMovement(
                from_account_id=None, # External source (e.g. Bank)
                to_account_id=pc_account.id,
                company_id=c_obj.id,
                amount=5000.0,
                description="Monthly Petty Cash Replenishment",
                reference="BANK-XFER-001",
                date=date.today() - timedelta(days=20)
            )
            db.add(movement)
    
    db.commit()

    # 11. Seed Payment Requests
    print("Seeding payment requests...")
    for c_name_str, c_obj in company_objs.items():
        # Get employees for this company
        company_employees = db.query(Employee).filter(Employee.company_id == c_obj.id).all()
        if company_employees:
            req_data = [
                {"title": "Internet Subscription Reimbursement", "amount": 50.0, "status": "PENDING"},
                {"title": "Office Snacks for IT Dept", "amount": 120.0, "status": "APPROVED"},
                {"title": "Fuel for Logistics Truck", "amount": 250.0, "status": "PAID"},
            ]
            for i, rd in enumerate(req_data):
                emp = company_employees[i % len(company_employees)]
                request = PaymentRequest(
                    title=rd["title"],
                    description=f"Request for {rd['title']} for {c_name_str} operations.",
                    amount=rd["amount"],
                    status=rd["status"],
                    request_date=date.today() - timedelta(days=random.randint(1, 10)),
                    company_id=c_obj.id,
                    employee_id=emp.id
                )
                db.add(request)
    
    db.commit()

    # 12. Seed Revenues
    print("Seeding revenues...")
    for c_name_str, c_obj in company_objs.items():
        revenue_data = [
            {"source": "Service Fee", "amount": 15000.0, "desc": "Monthly consulting service fee"},
            {"source": "Project Milestone", "amount": 25000.0, "desc": "Phase 1 completion bonus"},
            {"source": "Direct Sale", "amount": 8500.0, "desc": "Software license renewal"},
        ]
        for rd in revenue_data:
            revenue = Revenue(
                source=rd["source"],
                amount=rd["amount"],
                description=rd["desc"],
                date=date.today() - timedelta(days=random.randint(1, 45)),
                reference_number=f"INV-{c_name_str[:3].upper()}-{random.randint(1000, 9999)}",
                company_id=c_obj.id
            )
            db.add(revenue)
    
    db.commit()

    # 13. Seed Expenses
    print("Seeding expenses...")
    for c_name_str, c_obj in company_objs.items():
        expense_data = [
            {"category": "Rent", "amount": 2500.0, "desc": "Office space monthly rent", "method": "Bank Transfer"},
            {"category": "Utilities", "amount": 450.0, "desc": "Electricity and water bill", "method": "Cash"},
            {"category": "Office Supplies", "amount": 150.0, "desc": "Stationery and printer ink", "method": "Cash"},
            {"category": "Communication", "amount": 200.0, "desc": "Internet and phone bills", "method": "Bank Transfer"},
        ]
        for rd in expense_data:
            expense = Expense(
                category=rd["category"],
                amount=rd["amount"],
                description=rd["desc"],
                date=date.today() - timedelta(days=random.randint(1, 45)),
                reference_number=f"EXP-{c_name_str[:3].upper()}-{random.randint(1000, 9999)}",
                payment_method=rd["method"],
                company_id=c_obj.id
            )
            db.add(expense)
    
    db.commit()

    # 14. Seed Maintenance
    print("Seeding maintenance records...")
    all_assets = db.query(Asset).all()
    for asset in all_assets:
        maint_data = [
            {"title": "Routine Inspection", "cost": 50.0, "status": "COMPLETED"},
            {"title": "Emergency Repair", "cost": 300.0, "status": "IN_PROGRESS"},
        ]
        # Only seed for some assets to keep it diverse
        if random.random() > 0.5:
            for md in maint_data:
                maint = Maintenance(
                    asset_id=asset.id,
                    company_id=asset.company_id,
                    title=f"{asset.name} - {md['title']}",
                    description=f"Detailed {md['title'].lower()} for {asset.name}",
                    cost=md["cost"] if md["status"] == "COMPLETED" else 0.0,
                    status=md["status"],
                    start_date=date.today() - timedelta(days=random.randint(1, 30)),
                    completion_date=date.today() if md["status"] == "COMPLETED" else None
                )
                db.add(maint)
    
    db.commit()

    print("Database seeded successfully with all modules including Maintenance.")
    db.close()

if __name__ == "__main__":
    seed_db()
