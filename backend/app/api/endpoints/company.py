from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyResponse, CompanyUpdate
from app.core.security import get_current_user, RoleChecker

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """Retrieve all companies."""
    return db.query(Company).all()

@router.put("/{company_id}", response_model=CompanyResponse, dependencies=[Depends(RoleChecker(["Super Admin", "HR Manager"]))])
def update_company(company_id: int, company_in: CompanyUpdate, db: Session = Depends(get_db)):
    """Update company information."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company_in.name is not None:
        company.name = company_in.name
    if company_in.description is not None:
        company.description = company_in.description
        
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
