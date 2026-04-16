import sqlite3

def manual_clear():
    conn = sqlite3.connect('talentia.db')
    cursor = conn.cursor()
    
    tables = [
        "attendance",
        "performance_reviews",
        "payslips",
        "payroll_runs",
        "maintenance_records",
        "assets",
        "petty_cash_transactions",
        "cash_movements",
        "petty_cash_accounts",
        "payment_requests",
        "revenues",
        "expenses",
        "employees"
    ]
    
    print("Directly clearing tables...")
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"Cleared {table}")
        except sqlite3.OperationalError as e:
            print(f"Skipping {table}: {e}")
            
    conn.commit()
    conn.close()
    print("Database cleared manually.")

if __name__ == "__main__":
    manual_clear()
