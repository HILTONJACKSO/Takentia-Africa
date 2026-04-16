from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class TransactionType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"

class PettyCashAccount(Base):
    __tablename__ = "petty_cash_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    balance = Column(Float, default=0.0)
    company_id = Column(Integer, ForeignKey("companies.id"))

    company = relationship("Company")

class PettyCashTransaction(Base):
    __tablename__ = "petty_cash_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("petty_cash_accounts.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    type = Column(SAEnum(TransactionType))
    amount = Column(Float, nullable=False)
    description = Column(String)
    date = Column(Date)
    approved_by_id = Column(Integer, ForeignKey("users.id"))
    
    account = relationship("PettyCashAccount")
    company = relationship("Company")
    approved_by = relationship("User")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    serial_number = Column(String, unique=True, index=True)
    status = Column(String, default="ACTIVE")
    company_id = Column(Integer, ForeignKey("companies.id"))
    assigned_to_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    company = relationship("Company")
    assigned_to = relationship("Employee")

class CashMovement(Base):
    __tablename__ = "cash_movements"

    id = Column(Integer, primary_key=True, index=True)
    from_account_id = Column(Integer, ForeignKey("petty_cash_accounts.id"), nullable=True) # Null if from external source
    to_account_id = Column(Integer, ForeignKey("petty_cash_accounts.id"), nullable=True)   # Null if to external source
    company_id = Column(Integer, ForeignKey("companies.id"))
    amount = Column(Float, nullable=False)
    description = Column(String)
    reference = Column(String) # e.g. "Cheque #123", "Bank Transfer Ref"
    date = Column(Date)
    
    from_account = relationship("PettyCashAccount", foreign_keys=[from_account_id])
    to_account = relationship("PettyCashAccount", foreign_keys=[to_account_id])
    company = relationship("Company")

class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED, PAID
    request_date = Column(Date)
    company_id = Column(Integer, ForeignKey("companies.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    attachment_url = Column(String, nullable=True)
    
    company = relationship("Company")
    employee = relationship("Employee")

class Revenue(Base):
    __tablename__ = "revenues"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, index=True) # e.g. "Consulting", "Service Fee"
    amount = Column(Float, nullable=False)
    description = Column(String)
    date = Column(Date)
    reference_number = Column(String)
    payment_method = Column(String) # e.g. "Cash", "Bank Transfer"
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    company = relationship("Company")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True) # e.g. "Office Supplies", "Rent", "Utilities"
    amount = Column(Float, nullable=False)
    description = Column(String)
    date = Column(Date)
    reference_number = Column(String)
    payment_method = Column(String) # e.g. "Cash", "Bank Transfer"
    company_id = Column(Integer, ForeignKey("companies.id"))
    
    company = relationship("Company")

class Maintenance(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    title = Column(String, index=True)
    description = Column(String)
    cost = Column(Float, default=0.0)
    status = Column(String, default="PENDING") # PENDING, IN_PROGRESS, COMPLETED
    start_date = Column(Date)
    completion_date = Column(Date, nullable=True)
    
    asset = relationship("Asset")
    company = relationship("Company")
