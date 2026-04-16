from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.models.operations import TransactionType
from app.schemas.user import UserResponse

class PettyCashAccountBase(BaseModel):
    name: str

class PettyCashAccountCreate(PettyCashAccountBase):
    company_id: int
    balance: Optional[float] = 0.0

class PettyCashAccountResponse(PettyCashAccountBase):
    id: int
    balance: float

    class Config:
        from_attributes = True

class PettyCashTransactionBase(BaseModel):
    account_id: int
    type: TransactionType
    amount: float
    description: Optional[str] = None
    date: date

class PettyCashTransactionCreate(PettyCashTransactionBase):
    company_id: Optional[int] = None

class PettyCashTransactionResponse(PettyCashTransactionBase):
    id: int
    approved_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class AssetBase(BaseModel):
    name: str
    category: str
    serial_number: str
    status: Optional[str] = "ACTIVE"
    assigned_to_id: Optional[int] = None

class AssetCreate(AssetBase):
    company_id: int

class AssetResponse(AssetBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True

class CashMovementBase(BaseModel):
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    company_id: int
    amount: float
    description: Optional[str] = None
    reference: Optional[str] = None
    date: date

class CashMovementCreate(CashMovementBase):
    pass

class CashMovementResponse(CashMovementBase):
    id: int

    class Config:
        from_attributes = True

class PaymentRequestBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    status: Optional[str] = "PENDING"
    request_date: date
    company_id: int
    employee_id: int
    attachment_url: Optional[str] = None

class PaymentRequestCreate(PaymentRequestBase):
    pass

class PaymentRequestUpdateStatus(BaseModel):
    status: str
    account_id: Optional[int] = None
    payment_date: Optional[date] = None

class PaymentRequestResponse(PaymentRequestBase):
    id: int

    class Config:
        from_attributes = True

class RevenueBase(BaseModel):
    source: str
    amount: float
    description: Optional[str] = None
    date: date
    reference_number: Optional[str] = None
    payment_method: Optional[str] = "Cash"
    account_id: Optional[int] = None
    company_id: int

class RevenueCreate(RevenueBase):
    pass

class RevenueResponse(RevenueBase):
    id: int

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    date: date
    reference_number: Optional[str] = None
    payment_method: Optional[str] = "Cash"
    account_id: Optional[int] = None
    company_id: int

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True

class MaintenanceBase(BaseModel):
    asset_id: int
    company_id: int
    title: str
    description: Optional[str] = None
    cost: Optional[float] = 0.0
    status: Optional[str] = "PENDING"
    start_date: date
    completion_date: Optional[date] = None

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceResponse(MaintenanceBase):
    id: int

    class Config:
        from_attributes = True
