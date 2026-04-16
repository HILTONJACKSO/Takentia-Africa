from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.payroll import PayrollRun, Payslip, PayrollStatus
from app.models.hr import Employee, EmploymentStatus
from app.schemas.payroll import PayrollRunOut, PayrollRunCreate, PayslipOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/runs/generate", response_model=PayrollRunOut)
def generate_payroll_run(
    payroll_in: PayrollRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if a run for this month/year already exists
    existing_run = db.query(PayrollRun).filter(
        PayrollRun.month == payroll_in.month,
        PayrollRun.year == payroll_in.year,
        PayrollRun.company_id == payroll_in.company_id
    ).first()
    
    if existing_run:
        raise HTTPException(status_code=400, detail="Payroll run for this month already exists")

    new_run = PayrollRun(
        month=payroll_in.month,
        year=payroll_in.year,
        status=PayrollStatus.DRAFT,
        total_amount=0.0,
        company_id=payroll_in.company_id
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)

    # Fetch all active employees
    active_employees = db.query(Employee).filter(
        Employee.status == EmploymentStatus.ACTIVE,
        Employee.company_id == payroll_in.company_id if payroll_in.company_id else True
    ).all()

    total_amount = 0.0
    for emp in active_employees:
        base = emp.base_salary or 0.0
        # User requested calculation: 0% allowance, 10% deduction
        allowances = 0.0
        deductions = base * 0.10
        net = base + allowances - deductions
        
        payslip = Payslip(
            payroll_run_id=new_run.id,
            employee_id=emp.id,
            base_salary=base,
            allowances=allowances,
            deductions=deductions,
            net_salary=net
        )
        db.add(payslip)
        total_amount += net

    new_run.total_amount = total_amount
    db.commit()
    db.refresh(new_run)

    return new_run

@router.get("/runs", response_model=List[PayrollRunOut])
def get_payroll_runs(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PayrollRun)
    if company_id:
        query = query.filter(PayrollRun.company_id == company_id)
    return query.order_by(PayrollRun.year.desc(), PayrollRun.month.desc()).all()

@router.get("/runs/{run_id}/payslips", response_model=List[PayslipOut])
def get_payslips_for_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
        
    payslips = db.query(Payslip).filter(Payslip.payroll_run_id == run_id).all()
    return payslips

@router.patch("/runs/{run_id}/status", response_model=PayrollRunOut)
def update_payroll_status(
    run_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    try:
        new_status = PayrollStatus(status.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status. Must be DRAFT, APPROVED, or PAID")
        
    run.status = new_status
    db.commit()
    db.refresh(run)
    return run
