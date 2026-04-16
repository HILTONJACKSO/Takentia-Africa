from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.hr import Employee, Department
from app.models.operations import Asset, PettyCashAccount, Revenue, Expense, PaymentRequest

router = APIRouter()

@router.get("/dashboard-stats")
def get_dashboard_stats(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Employee Count
    emp_query = db.query(Employee)
    if company_id:
        emp_query = emp_query.filter(Employee.company_id == company_id)
    total_employees = emp_query.count()

    # 2. Asset Count
    asset_query = db.query(Asset)
    if company_id:
        asset_query = asset_query.filter(Asset.company_id == company_id)
    total_assets = asset_query.count()

    # 3. Financials (Total)
    # Corrected pc_query to handle company filtering
    rev_query = db.query(func.sum(Revenue.amount))
    exp_query = db.query(func.sum(Expense.amount))
    pc_query = db.query(func.sum(PettyCashAccount.balance))
    pr_query = db.query(PaymentRequest).filter(PaymentRequest.status == "PENDING")

    if company_id:
        rev_query = rev_query.filter(Revenue.company_id == company_id)
        exp_query = exp_query.filter(Expense.company_id == company_id)
        pc_query = pc_query.filter(PettyCashAccount.company_id == company_id)
        pr_query = pr_query.filter(PaymentRequest.company_id == company_id)

    total_revenue = rev_query.scalar() or 0.0
    total_expenses = exp_query.scalar() or 0.0
    petty_cash = pc_query.scalar() or 0.0
    pending_requests = pr_query.count()

    return {
        "total_employees": total_employees,
        "total_assets": total_assets,
        "petty_cash_balance": petty_cash,
        "total_expenses": total_expenses,
        "total_revenue": total_revenue,
        "pending_requests": pending_requests,
        "profitability": total_revenue - total_expenses
    }

@router.get("/financial-history")
def get_financial_history(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    history = []
    # Last 6 months
    today = datetime.now()
    for i in range(5, -1, -1):
        # Calculate target month
        target_month = (today.month - i - 1) % 12 + 1
        target_year = today.year + (today.month - i - 1) // 12
        
        start_date = datetime(target_year, target_month, 1)
        if target_month == 12:
            end_date = datetime(target_year + 1, 1, 1)
        else:
            end_date = datetime(target_year, target_month + 1, 1)
            
        rev_q = db.query(func.sum(Revenue.amount)).filter(Revenue.date >= start_date, Revenue.date < end_date)
        exp_q = db.query(func.sum(Expense.amount)).filter(Expense.date >= start_date, Expense.date < end_date)
        
        if company_id:
            rev_q = rev_q.filter(Revenue.company_id == company_id)
            exp_q = exp_q.filter(Expense.company_id == company_id)
            
        history.append({
            "month": start_date.strftime("%b %Y"),
            "revenue": rev_q.scalar() or 0.0,
            "expenses": exp_q.scalar() or 0.0
        })
    return history

@router.get("/distribution")
def get_distribution_stats(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Expense by Category
    exp_dist_q = db.query(Expense.category, func.sum(Expense.amount))
    if company_id:
        exp_dist_q = exp_dist_q.filter(Expense.company_id == company_id)
    expenses_by_category = exp_dist_q.group_by(Expense.category).all()

    # 2. Employees by Department
    emp_dist_q = db.query(Department.name, func.count(Employee.id)).join(Employee)
    if company_id:
        emp_dist_q = emp_dist_q.filter(Employee.company_id == company_id)
    employees_by_department = emp_dist_q.group_by(Department.name).all()

    return {
        "expenses_by_category": [{"category": c, "amount": a} for c, a in expenses_by_category],
        "employees_by_department": [{"department": d, "count": c} for d, c in employees_by_department]
    }

@router.get("/staff-growth")
def get_staff_growth(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    growth = []
    today = datetime.now()
    for i in range(5, -1, -1):
        target_month = (today.month - i - 1) % 12 + 1
        target_year = today.year + (today.month - i - 1) // 12
        end_date = datetime(target_year, target_month, 1)
        if target_month == 12:
            next_month_start = datetime(target_year + 1, 1, 1)
        else:
            next_month_start = datetime(target_year, target_month + 1, 1)
        
        # Cumulative count up to the end of this month
        q = db.query(Employee).filter(Employee.hire_date < next_month_start)
        if company_id:
            q = q.filter(Employee.company_id == company_id)
            
        count = q.count()
        growth.append({
            "month": end_date.strftime("%b"),
            "count": count
        })
    return growth

@router.get("/recent-activity")
def get_recent_activity(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    activities = []
    
    # 1. Recent Employees
    emp_q = db.query(Employee).order_by(Employee.hire_date.desc()).limit(3)
    if company_id:
        emp_q = emp_q.filter(Employee.company_id == company_id)
    for emp in emp_q.all():
        activities.append({
            "title": f"New staff member added: {emp.first_name} {emp.last_name}",
            "subtitle": f"Position: {emp.position}",
            "time": emp.hire_date.strftime("%Y-%m-%d"),
            "icon": "bi-person-plus",
            "color": "warning"
        })
        
    # 2. Recent Payment Requests
    pr_q = db.query(PaymentRequest).order_by(PaymentRequest.request_date.desc()).limit(3)
    if company_id:
        pr_q = pr_q.filter(PaymentRequest.company_id == company_id)
    for pr in pr_q.all():
        activities.append({
            "title": f"Payment request: {pr.title}",
            "subtitle": f"Status: {pr.status}",
            "time": pr.request_date.strftime("%Y-%m-%d"),
            "icon": "bi-currency-dollar",
            "color": "info"
        })
        
    # Sort activities by time (proxy for recentness)
    activities.sort(key=lambda x: x["time"], reverse=True)
    return activities[:5]
