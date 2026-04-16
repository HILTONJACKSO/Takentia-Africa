from pydantic import BaseModel, EmailStr
from typing import Optional

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
