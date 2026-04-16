from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.user import User
from app.api.endpoints.notification import create_notification
from app.models.user import User, Role
from app.models.operations import PettyCashAccount, PettyCashTransaction, Asset, TransactionType, CashMovement, PaymentRequest, Revenue, Expense, Maintenance
from app.schemas.operations import (
    PettyCashAccountCreate, PettyCashAccountResponse, 
    PettyCashTransactionCreate, PettyCashTransactionResponse, 
    AssetCreate, AssetResponse,
    CashMovementCreate, CashMovementResponse,
    PaymentRequestCreate, PaymentRequestResponse, PaymentRequestUpdateStatus,
    RevenueCreate, RevenueResponse,
    ExpenseCreate, ExpenseResponse,
    MaintenanceCreate, MaintenanceResponse
)

router = APIRouter()

admin_finance_roles = ["Super Admin", "Finance Manager"]
ops_roles = ["Super Admin", "Operations Officer"]
all_roles = ["Super Admin", "HR Manager", "Finance Manager", "Operations Officer", "Staff"]

# Petty Cash
@router.post("/petty-cash/accounts", response_model=PettyCashAccountResponse, dependencies=[Depends(RoleChecker(admin_finance_roles))])
def create_petty_cash_account(account: PettyCashAccountCreate, db: Session = Depends(get_db)):
    new_account = PettyCashAccount(**account.dict())
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@router.get("/petty-cash/accounts", response_model=List[PettyCashAccountResponse], dependencies=[Depends(RoleChecker(admin_finance_roles + ["Operations Officer"]))])
def get_petty_cash_accounts(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(PettyCashAccount)
    if company_id:
        query = query.filter(PettyCashAccount.company_id == company_id)
    return query.all()

@router.post("/petty-cash/transactions", response_model=PettyCashTransactionResponse, dependencies=[Depends(RoleChecker(admin_finance_roles))])
def create_petty_cash_transaction(transaction: PettyCashTransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(PettyCashAccount).filter(PettyCashAccount.id == transaction.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Use account's company_id if not provided in transaction
    tx_data = transaction.dict()
    if not tx_data.get('company_id'):
        tx_data['company_id'] = account.company_id
    
    new_tx = PettyCashTransaction(**tx_data, approved_by_id=current_user.id)
    if transaction.type == TransactionType.IN:
        account.balance += transaction.amount
    else:
        if account.balance < transaction.amount:
            raise HTTPException(status_code=400, detail="Insufficient petty cash funds")
        account.balance -= transaction.amount

    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.get("/petty-cash/transactions", response_model=List[PettyCashTransactionResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_petty_cash_transactions(company_id: Optional[int] = None, account_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(PettyCashTransaction).options(joinedload(PettyCashTransaction.approved_by))
    if company_id:
        query = query.filter(PettyCashTransaction.company_id == company_id)
    if account_id:
        query = query.filter(PettyCashTransaction.account_id == account_id)
    return query.order_by(PettyCashTransaction.date.desc()).all()

# Cash Movements
@router.post("/cash-movements", response_model=CashMovementResponse, dependencies=[Depends(RoleChecker(admin_finance_roles))])
def create_cash_movement(movement: CashMovementCreate, db: Session = Depends(get_db)):
    # Basic validation
    if not movement.from_account_id and not movement.to_account_id:
        raise HTTPException(status_code=400, detail="Either from_account or to_account must be specified")
    
    # 1. Deduct from source account if internal
    if movement.from_account_id:
        from_acc = db.query(PettyCashAccount).filter(PettyCashAccount.id == movement.from_account_id).first()
        if not from_acc:
            raise HTTPException(status_code=404, detail="Source account not found")
        if from_acc.balance < movement.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds in source account")
        from_acc.balance -= movement.amount

    # 2. Add to destination account if internal
    if movement.to_account_id:
        to_acc = db.query(PettyCashAccount).filter(PettyCashAccount.id == movement.to_account_id).first()
        if not to_acc:
            raise HTTPException(status_code=404, detail="Destination account not found")
        to_acc.balance += movement.amount

    new_mv = CashMovement(**movement.dict())
    db.add(new_mv)
    db.commit()
    db.refresh(new_mv)
    return new_mv

@router.get("/cash-movements", response_model=List[CashMovementResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_cash_movements(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(CashMovement)
    if company_id:
        query = query.filter(CashMovement.company_id == company_id)
    return query.order_by(CashMovement.date.desc()).all()

# Payment Requests
@router.post("/payment-requests", response_model=PaymentRequestResponse, dependencies=[Depends(RoleChecker(all_roles))])
def create_payment_request(request: PaymentRequestCreate, db: Session = Depends(get_db)):
    new_request = PaymentRequest(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/payment-requests", response_model=List[PaymentRequestResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_payment_requests(company_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PaymentRequest)
    if company_id:
        query = query.filter(PaymentRequest.company_id == company_id)
    if status:
        query = query.filter(PaymentRequest.status == status)
    return query.order_by(PaymentRequest.request_date.desc()).all()

@router.patch("/payment-requests/{request_id}/status", response_model=PaymentRequestResponse, dependencies=[Depends(RoleChecker(admin_finance_roles))])
def update_payment_request_status(request_id: int, status_update: PaymentRequestUpdateStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_request = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    # If moving to PAID status and an account is specified
    if status_update.status == "PAID" and status_update.account_id:
        account = db.query(PettyCashAccount).filter(PettyCashAccount.id == status_update.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Petty Cash Account not found")
        
        if account.balance < db_request.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds in the selected petty cash account")
        
        # Deduct balance
        account.balance -= db_request.amount
        
        # Create transaction
        new_tx = PettyCashTransaction(
            account_id=account.id,
            company_id=db_request.company_id,
            type=TransactionType.OUT,
            amount=db_request.amount,
            description=f"Payment for Request #{db_request.id}: {db_request.title}",
            date=status_update.payment_date or date.today(),
            approved_by_id=current_user.id
        )
        db.add(new_tx)

    db_request.status = status_update.status
    db.commit()

    # Trigger Notification for the requester
    requester_user = db.query(User).filter(User.employee_id == db_request.employee_id).first()
    if requester_user:
        create_notification(
            db=db,
            user_id=requester_user.id,
            title="Payment Request Updated",
            message=f"Your payment request '{db_request.title}' for ${db_request.amount} has been marked as {status_update.status}.",
            link=f"/dashboard/operations/payment-requests?company_id={db_request.company_id}"
        )

    db.refresh(db_request)
    return db_request

# Revenues
@router.post("/revenues", response_model=RevenueResponse, dependencies=[Depends(RoleChecker(admin_finance_roles))])
def create_revenue(revenue: RevenueCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # If using Cash and an account is provided
    if revenue.payment_method == "Cash" and revenue.account_id:
        account = db.query(PettyCashAccount).filter(PettyCashAccount.id == revenue.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Petty Cash Account not found")
        
        # Add to balance
        account.balance += revenue.amount
        
        # Create transaction
        new_tx = PettyCashTransaction(
            account_id=account.id,
            company_id=revenue.company_id,
            type=TransactionType.IN,
            amount=revenue.amount,
            description=f"Revenue: {revenue.source}",
            date=revenue.date or date.today(),
            approved_by_id=current_user.id
        )
        db.add(new_tx)

    new_revenue = Revenue(**revenue.dict(exclude={"account_id"}))
    db.add(new_revenue)
    db.commit()
    db.refresh(new_revenue)
    return new_revenue

@router.get("/revenues", response_model=List[RevenueResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_revenues(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Revenue)
    if company_id:
        query = query.filter(Revenue.company_id == company_id)
    return query.order_by(Revenue.date.desc()).all()

# Expenses
@router.post("/expenses", response_model=ExpenseResponse, dependencies=[Depends(RoleChecker(admin_finance_roles))])
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # If using Cash and an account is provided
    if expense.payment_method == "Cash" and expense.account_id:
        account = db.query(PettyCashAccount).filter(PettyCashAccount.id == expense.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Petty Cash Account not found")
        
        if account.balance < expense.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds in the selected petty cash account")
        
        # Deduct balance
        account.balance -= expense.amount
        
        # Create transaction
        new_tx = PettyCashTransaction(
            account_id=account.id,
            company_id=expense.company_id,
            type=TransactionType.OUT,
            amount=expense.amount,
            description=f"Expense: {expense.description or expense.category}",
            date=expense.date or date.today(),
            approved_by_id=current_user.id
        )
        db.add(new_tx)

    new_expense = Expense(**expense.dict(exclude={"account_id"}))
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/expenses", response_model=List[ExpenseResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_expenses(company_id: Optional[int] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Expense)
    if company_id:
        query = query.filter(Expense.company_id == company_id)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.date.desc()).all()

# Maintenance
@router.post("/maintenance", response_model=MaintenanceResponse, dependencies=[Depends(RoleChecker(ops_roles))])
def create_maintenance(maintenance: MaintenanceCreate, db: Session = Depends(get_db)):
    new_maint = Maintenance(**maintenance.dict())
    db.add(new_maint)
    db.commit()
    db.refresh(new_maint)
    return new_maint

@router.get("/maintenance", response_model=List[MaintenanceResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_maintenance(company_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Maintenance)
    if company_id:
        query = query.filter(Maintenance.company_id == company_id)
    if status:
        query = query.filter(Maintenance.status == status)
    return query.order_by(Maintenance.start_date.desc()).all()

# Assets
@router.post("/assets", response_model=AssetResponse, dependencies=[Depends(RoleChecker(ops_roles))])
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    new_asset = Asset(**asset.dict())
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@router.get("/assets", response_model=List[AssetResponse], dependencies=[Depends(RoleChecker(all_roles))])
def get_assets(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Asset)
    if company_id:
        query = query.filter(Asset.company_id == company_id)
    return query.all()
