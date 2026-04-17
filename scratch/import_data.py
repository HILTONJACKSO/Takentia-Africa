import json
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL").replace("%%40", "%40")

def import_data():
    with open("sqlite_data_dump.json", "r") as f:
        data = json.load(f)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Table order to respect FKs
    tables = [
        'companies', 'departments', 'roles', 'users', 'employees',
        'petty_cash_accounts', 'revenues', 'expenses', 'payroll_runs',
        'attendance', 'assets', 'cash_movements', 'payment_requests',
        'payslips', 'performance_reviews', 'petty_cash_transactions',
        'maintenance_records', 'notifications'
    ]

    for table in tables:
        if table not in data:
            print(f"Skipping {table}, not in data dump")
            continue
        
        rows = data[table]
        if not rows:
            print(f"No rows for {table}")
            continue

        print(f"Importing {len(rows)} rows into {table}...")
        
        columns = rows[0].keys()
        query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(columns))}) ON CONFLICT DO NOTHING"
        
        for row in rows:
            values = []
            for col in columns:
                val = row[col]
                # PostgreSQL boolean conversion
                if table == 'users' and col == 'is_active' and isinstance(val, int):
                    val = bool(val)
                values.append(val)
            cur.execute(query, values)
        
        # Reset sequence
        cur.execute(f"SELECT pg_get_serial_sequence('{table}', 'id')")
        seq = cur.fetchone()[0]
        if seq:
            cur.execute(f"SELECT setval('{seq}', (SELECT MAX(id) FROM {table}))")

    conn.commit()
    cur.close()
    conn.close()
    print("Data import complete.")

if __name__ == "__main__":
    import_data()
