import sqlite3
import bcrypt

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

db_path = 'talentia.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

new_email = 'admin@gmail.com'
new_password = 'password123'
new_hash = get_password_hash(new_password)

# Try updating the existing 'admin@talentia.africa'
cursor.execute("UPDATE users SET email = ?, password_hash = ? WHERE email = 'admin@talentia.africa'", (new_email, new_hash))
if cursor.rowcount > 0:
    print(f"Updated existing admin@talentia.africa to {new_email}")
else:
    # Maybe it was already updated or renamed? Check for admin@gmail.com
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (new_hash, new_email))
    if cursor.rowcount > 0:
        print(f"Updated password for existing {new_email}")
    else:
        # If neither exists (unlikely given previous check), insert a new one
        # But we need a role_id... let's assume role_id 1 is Super Admin per seed.py
        cursor.execute("INSERT INTO users (email, password_hash, role_id, is_active) VALUES (?, ?, 1, 1)", (new_email, new_hash))
        print(f"Created new admin user: {new_email}")

conn.commit()
conn.close()
print("Direct database update complete.")
