from app.core.database import SessionLocal, engine, Base
from app.models.hr import Employee, Department, Attendance, PerformanceReview
from app.models.operations import Asset, PettyCashAccount, PettyCashTransaction, PaymentRequest, Revenue, Expense, CashMovement, Maintenance
from app.models.payroll import PayrollRun, Payslip
from app.models.user import User

def clear_data():
    db = SessionLocal()
    print("Clearing all enterprise data...")
    
    # Order matters for foreign keys if not using cascade delete at DB level
    db.query(Attendance).delete()
    db.query(PerformanceReview).delete()
    db.query(Payslip).delete()
    db.query(PayrollRun).delete()
    db.query(Maintenance).delete()
    db.query(Asset).delete()
    db.query(PettyCashTransaction).delete()
    db.query(CashMovement).delete()
    db.query(PettyCashAccount).delete()
    db.query(PaymentRequest).delete()
    db.query(Revenue).delete()
    db.query(Expense).delete()
    
    # We keep Departments for now as they are structural, but can clear Employees
    db.query(Employee).delete()
    
    # Note: We do NOT delete Users (Admin) or Roles
    
    db.commit()
    db.close()
    print("Database cleared. System is now in a zero-state.")

if __name__ == "__main__":
    clear_data()
