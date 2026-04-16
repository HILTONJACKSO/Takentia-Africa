from fastapi import APIRouter
from app.api.endpoints import auth, hr, operations, payroll, reports, company, notification

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["payroll"])
api_router.include_router(operations.router, prefix="/operations", tags=["operations"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(company.router, prefix="/companies", tags=["companies"])
api_router.include_router(notification.router, prefix="/notifications", tags=["notifications"])
