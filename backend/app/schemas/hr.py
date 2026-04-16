from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from app.models.hr import EmploymentStatus, AttendanceStatus

class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    qualification: Optional[str] = None
    department_id: int
    position: str
    contract_type: str
    status: Optional[EmploymentStatus] = EmploymentStatus.ACTIVE
    hire_date: date
    photo_path: Optional[str] = None
    cv_path: Optional[str] = None
    base_salary: float = 0.0
    company_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    employee_id: int
    company_id: int
    date: date
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True

class PerformanceReviewBase(BaseModel):
    employee_id: int
    company_id: int
    reviewer_id: Optional[int] = None
    review_date: date
    rating: int
    comments: Optional[str] = None
    goals: Optional[str] = None
    strengths: Optional[str] = None
    improvements: Optional[str] = None

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewResponse(PerformanceReviewBase):
    id: int
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True
