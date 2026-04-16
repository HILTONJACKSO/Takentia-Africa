from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.payroll import PayrollStatus
from app.schemas.hr import EmployeeResponse

class PayslipBase(BaseModel):
    employee_id: int
    base_salary: float
    allowances: float
    deductions: float
    net_salary: float

class PayslipCreate(PayslipBase):
    pass

class PayslipOut(PayslipBase):
    id: int
    payroll_run_id: int
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True

class PayrollRunBase(BaseModel):
    month: int
    year: int
    total_amount: float = 0.0
    company_id: Optional[int] = None

class PayrollRunCreate(PayrollRunBase):
    pass

class PayrollRunOut(PayrollRunBase):
    id: int
    status: PayrollStatus
    created_at: datetime
    payslips: List[PayslipOut] = []

    class Config:
        from_attributes = True
