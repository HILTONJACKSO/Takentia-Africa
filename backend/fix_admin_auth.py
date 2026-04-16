from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@talentia.africa').first()
if admin:
    admin.email = 'admin@gmail.com'
    admin.password_hash = get_password_hash('password123')
    db.commit()
    print("Successfully updated admin credentials to admin@gmail.com / password123")
else:
    # Check if it already exists correctly
    admin_correct = db.query(User).filter(User.email == 'admin@gmail.com').first()
    if admin_correct:
         admin_correct.password_hash = get_password_hash('password123')
         db.commit()
         print("Admin admin@gmail.com already exists. Updated password.")
    else:
         print("Admin user not found in database.")
db.close()
