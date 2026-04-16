from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class EmploymentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    TERMINATED = "TERMINATED"
    ON_LEAVE = "ON_LEAVE"
    PROSPECTIVE = "PROSPECTIVE"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    ON_LEAVE = "ON_LEAVE"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    employees = relationship("Employee", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    date_of_birth = Column(Date, nullable=True)
    qualification = Column(String, nullable=True)
    
    department_id = Column(Integer, ForeignKey("departments.id"))
    position = Column(String)
    contract_type = Column(String)
    status = Column(SAEnum(EmploymentStatus), default=EmploymentStatus.ACTIVE)
    hire_date = Column(Date)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    photo_path = Column(String, nullable=True)
    cv_path = Column(String, nullable=True)
    base_salary = Column(Float, default=0.0)
    
    department = relationship("Department", back_populates="employees")
    company = relationship("Company")
    attendance_records = relationship("Attendance", back_populates="employee")
    performance_reviews = relationship("PerformanceReview", back_populates="employee")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    date = Column(Date, nullable=False)
    check_in = Column(String, nullable=True)
    check_out = Column(String, nullable=True)
    status = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    notes = Column(String, nullable=True)

    employee = relationship("Employee", back_populates="attendance_records")
    company = relationship("Company")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Manager
    review_date = Column(Date, nullable=False)
    rating = Column(Integer, nullable=False) # 1-5
    comments = Column(String, nullable=True)
    goals = Column(String, nullable=True)
    strengths = Column(String, nullable=True)
    improvements = Column(String, nullable=True)

    employee = relationship("Employee", back_populates="performance_reviews")
    company = relationship("Company")
    reviewer = relationship("User")
