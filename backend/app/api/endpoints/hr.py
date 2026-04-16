from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from datetime import date, datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.user import User
from app.models.hr import Employee, Department, EmploymentStatus, Attendance, AttendanceStatus, PerformanceReview
from app.schemas.hr import EmployeeResponse, DepartmentCreate, DepartmentResponse, AttendanceCreate, AttendanceResponse, PerformanceReviewCreate, PerformanceReviewResponse

router = APIRouter()


# Constants
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Role requirements
hr_manager_roles = ["Super Admin", "HR Manager"]
read_roles = hr_manager_roles + ["Finance Manager", "Operations Officer", "Staff"]

# Departments
@router.post("/departments", response_model=DepartmentResponse, dependencies=[Depends(RoleChecker(hr_manager_roles))])
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.name == department.name).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department already exists")
    new_dept = Department(name=department.name)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Department).all()

# Employees
@router.post("/employees", response_model=EmployeeResponse, dependencies=[Depends(RoleChecker(hr_manager_roles))])
async def create_employee(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    qualification: Optional[str] = Form(None),
    department_id: int = Form(...),
    position: str = Form(...),
    contract_type: str = Form(...),
    status: Optional[EmploymentStatus] = Form(EmploymentStatus.ACTIVE),
    hire_date: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    cv: Optional[UploadFile] = File(None),
    company_id: int = Form(...),
    base_salary: float = Form(0.0),
    db: Session = Depends(get_db)
):
    db_emp = db.query(Employee).filter(Employee.email == email).first()
    if db_emp:
        raise HTTPException(status_code=400, detail="Employee with email already exists")
    
    # Handle dates (FastAPI Form transmits them as strings)
    dob = None
    if date_of_birth:
        try:
            dob = date.fromisoformat(date_of_birth)
        except ValueError:
            pass
            
    h_date = date.fromisoformat(hire_date)
    
    new_emp = Employee(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        date_of_birth=dob,
        qualification=qualification,
        department_id=department_id,
        position=position,
        contract_type=contract_type,
        status=status,
        hire_date=h_date,
        company_id=company_id,
        base_salary=base_salary,
    )
    
    # Save files if provided
    if photo:
        photo_ext = os.path.splitext(photo.filename)[1]
        photo_filename = f"photo_{email}_{os.urandom(4).hex()}{photo_ext}"
        photo_path = os.path.join(UPLOAD_DIR, photo_filename)
        with open(photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        new_emp.photo_path = photo_path
        
    if cv:
        cv_ext = os.path.splitext(cv.filename)[1]
        cv_filename = f"cv_{email}_{os.urandom(4).hex()}{cv_ext}"
        cv_path = os.path.join(UPLOAD_DIR, cv_filename)
        with open(cv_path, "wb") as buffer:
            shutil.copyfileobj(cv.file, buffer)
        new_emp.cv_path = cv_path

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@router.get("/employees", response_model=List[EmployeeResponse], dependencies=[Depends(RoleChecker(read_roles))])
def get_employees(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Employee)
    if company_id:
        query = query.filter(Employee.company_id == company_id)
    return query.all()

@router.get("/employees/{employee_id}", response_model=EmployeeResponse, dependencies=[Depends(RoleChecker(read_roles))])
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/employees/{employee_id}", response_model=EmployeeResponse, dependencies=[Depends(RoleChecker(hr_manager_roles))])
async def update_employee(
    employee_id: int,
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    date_of_birth: Optional[str] = Form(None),
    qualification: Optional[str] = Form(None),
    department_id: int = Form(...),
    position: str = Form(...),
    contract_type: str = Form(...),
    status: Optional[EmploymentStatus] = Form(EmploymentStatus.ACTIVE),
    hire_date: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    cv: Optional[UploadFile] = File(None),
    base_salary: float = Form(0.0),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    db_emp = db.query(Employee).filter(Employee.email == email, Employee.id != employee_id).first()
    if db_emp:
        raise HTTPException(status_code=400, detail="Another employee with this email already exists")

    employee.first_name = first_name
    employee.last_name = last_name
    employee.email = email
    employee.phone = phone
    employee.qualification = qualification
    employee.department_id = department_id
    employee.position = position
    employee.contract_type = contract_type
    employee.status = status
    employee.base_salary = base_salary

    if date_of_birth:
        try: employee.date_of_birth = date.fromisoformat(date_of_birth)
        except ValueError: pass
            
    if hire_date:
        try: employee.hire_date = date.fromisoformat(hire_date)
        except ValueError: pass
    
    if photo:
        photo_ext = os.path.splitext(photo.filename)[1]
        photo_filename = f"photo_{email}_{os.urandom(4).hex()}{photo_ext}"
        photo_path = os.path.join(UPLOAD_DIR, photo_filename)
        with open(photo_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        employee.photo_path = photo_path
        
    if cv:
        cv_ext = os.path.splitext(cv.filename)[1]
        cv_filename = f"cv_{email}_{os.urandom(4).hex()}{cv_ext}"
        cv_path = os.path.join(UPLOAD_DIR, cv_filename)
        with open(cv_path, "wb") as buffer:
            shutil.copyfileobj(cv.file, buffer)
        employee.cv_path = cv_path

    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(RoleChecker(hr_manager_roles))])
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    return None

# Performance
@router.post("/performance", response_model=PerformanceReviewResponse, dependencies=[Depends(RoleChecker(hr_manager_roles))])
def create_performance_review(review: PerformanceReviewCreate, db: Session = Depends(get_db)):
    db_review = PerformanceReview(**review.dict())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/performance", response_model=List[PerformanceReviewResponse], dependencies=[Depends(RoleChecker(read_roles))])
def get_performance_reviews(
    company_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PerformanceReview)
    if company_id:
        query = query.filter(PerformanceReview.company_id == company_id)
    if employee_id:
        query = query.filter(PerformanceReview.employee_id == employee_id)
    return query.all()

# Attendance
@router.post("/attendance", response_model=AttendanceResponse, dependencies=[Depends(RoleChecker(hr_manager_roles))])
def log_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db)):
    db_attendance = Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.get("/attendance", response_model=List[AttendanceResponse], dependencies=[Depends(RoleChecker(read_roles))])
def get_attendance(
    company_id: Optional[int] = None, 
    date: Optional[date] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Attendance)
    if company_id:
        query = query.filter(Attendance.company_id == company_id)
    if date:
        query = query.filter(Attendance.date == date)
    return query.all()

@router.get("/attendance/summary", dependencies=[Depends(RoleChecker(read_roles))])
def get_attendance_summary(
    company_id: int, 
    date: date, 
    db: Session = Depends(get_db)
):
    records = db.query(Attendance).filter(
        Attendance.company_id == company_id,
        Attendance.date == date
    ).all()
    
    summary = {
        "present": len([r for r in records if r.status == AttendanceStatus.PRESENT]),
        "absent": len([r for r in records if r.status == AttendanceStatus.ABSENT]),
        "late": len([r for r in records if r.status == AttendanceStatus.LATE]),
        "on_leave": len([r for r in records if r.status == AttendanceStatus.ON_LEAVE]),
        "total": len(records)
    }
    return summary

@router.put("/attendance/{record_id}/clock-out", response_model=AttendanceResponse, dependencies=[Depends(RoleChecker(hr_manager_roles))])
def admin_clock_out(record_id: int, db: Session = Depends(get_db)):
    att_record = db.query(Attendance).filter(Attendance.id == record_id).first()
    if not att_record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if att_record.check_out:
        raise HTTPException(status_code=400, detail="Employee has already been checked out")
        
    att_record.check_out = datetime.now().strftime("%H:%M:%S")
    db.commit()
    db.refresh(att_record)
    return att_record

@router.post("/attendance/check-in-out", response_model=AttendanceResponse)
def check_in_out(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        raise HTTPException(status_code=400, detail="Your account is not linked to an employee record. Please contact your HR Manager to link your system account to your employee file.")
    
    employee = db.query(Employee).filter(Employee.id == current_user.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
        
    today = date.today()
    now_time = datetime.now().strftime("%H:%M:%S")
    
    # Check if record exists for today
    att_record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today
    ).first()
    
    if not att_record:
        # Check In
        new_att = Attendance(
            employee_id=employee.id,
            company_id=employee.company_id or 1,
            date=today,
            check_in=now_time,
            status=AttendanceStatus.PRESENT
        )
        db.add(new_att)
        db.commit()
        db.refresh(new_att)
        return new_att
    
    if not att_record.check_out:
        # Check Out
        att_record.check_out = now_time
        db.commit()
        db.refresh(att_record)
        return att_record
        
    raise HTTPException(status_code=400, detail="Attendance already completed for today. You have already checked in and checked out.")

@router.get("/attendance/my-status", response_model=Optional[AttendanceResponse])
def get_my_attendance_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.employee_id:
        return None
        
    today = date.today()
    att_record = db.query(Attendance).filter(
        Attendance.employee_id == current_user.employee_id,
        Attendance.date == today
    ).first()
    
    return att_record
